package unoeste.projetoasilo.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Small in-memory limiter for the few public endpoints that receive writes.
 * It deliberately has no external dependency because the Railway deployment
 * currently runs a single application replica.
 */
public final class RequestRateLimiter
{
    private static final Duration MAX_ENTRY_AGE = Duration.ofHours(2);

    private final Map<String, AccessWindow> requests = new ConcurrentHashMap<>();
    private final AtomicLong totalRequests = new AtomicLong();
    private final Clock clock;

    public RequestRateLimiter()
    {
        this(Clock.systemUTC());
    }

    RequestRateLimiter(Clock clock)
    {
        this.clock = clock;
    }

    public boolean allow(String key, int maximumRequests, Duration window)
    {
        if (key == null || key.isBlank() || maximumRequests < 1 || window == null || window.isNegative() || window.isZero())
        {
            return false;
        }

        Instant now = clock.instant();
        if (totalRequests.incrementAndGet() % 100 == 0)
        {
            removeExpiredEntries(now);
        }

        AccessWindow updated = requests.compute(key, (ignored, current) -> {
            if (current == null || !now.isBefore(current.startedAt().plus(window)))
            {
                return new AccessWindow(now, 1);
            }
            return new AccessWindow(current.startedAt(), current.count() + 1);
        });

        return updated.count() <= maximumRequests;
    }

    public boolean isBlocked(String key, int maximumRequests, Duration window)
    {
        if (key == null || key.isBlank() || maximumRequests < 1 || window == null || window.isNegative() || window.isZero())
        {
            return true;
        }

        Instant now = clock.instant();
        AccessWindow current = requests.get(key);
        if (current == null)
        {
            return false;
        }

        if (!now.isBefore(current.startedAt().plus(window)))
        {
            requests.remove(key, current);
            return false;
        }

        return current.count() >= maximumRequests;
    }

    public void registerFailure(String key, Duration window)
    {
        if (key == null || key.isBlank() || window == null || window.isNegative() || window.isZero())
        {
            return;
        }

        Instant now = clock.instant();
        if (totalRequests.incrementAndGet() % 100 == 0)
        {
            removeExpiredEntries(now);
        }

        requests.compute(key, (ignored, current) -> {
            if (current == null || !now.isBefore(current.startedAt().plus(window)))
            {
                return new AccessWindow(now, 1);
            }
            return new AccessWindow(current.startedAt(), current.count() + 1);
        });
    }

    public void reset(String key)
    {
        if (key != null && !key.isBlank())
        {
            requests.remove(key);
        }
    }

    private void removeExpiredEntries(Instant now)
    {
        requests.entrySet().removeIf(entry -> !now.isBefore(entry.getValue().startedAt().plus(MAX_ENTRY_AGE)));
    }

    private record AccessWindow(Instant startedAt, int count) { }
}
