package unoeste.projetoasilo.db.migration;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import unoeste.projetoasilo.db.util.Banco;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;

@Component
public class DatabaseMigrationRunner implements ApplicationRunner
{
    private static final List<String> MIGRATIONS = List.of(
            "db/migration/V20260721_01__morador_nutricao.sql",
            "db/migration/V20260721_02__transparencia_auditoria.sql",
            "db/migration/V20260721_03__cargo_nutricionista.sql",
            "db/migration/V20260721_04__evolucao_nutricional_imc.sql",
            "db/migration/V20260721_05__prontuario_nutricional_imc.sql"
    );

    @Override
    public void run(ApplicationArguments args) throws Exception
    {
        Banco banco = Banco.getConnection();
        try
        {
            Connection connection = banco.conexaoJdbc();
            try (Statement statement = connection.createStatement())
            {
                statement.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(180) PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
            }

            for (String migration : MIGRATIONS)
            {
                aplicarSeNecessario(connection, migration);
            }
        }
        finally
        {
            banco.fechar();
        }
    }

    private void aplicarSeNecessario(Connection connection, String migration) throws Exception
    {
        try (PreparedStatement consulta = connection.prepareStatement("SELECT 1 FROM schema_migrations WHERE version = ?"))
        {
            consulta.setString(1, migration);
            try (ResultSet rs = consulta.executeQuery())
            {
                if (rs.next()) return;
            }
        }

        String sql = new ClassPathResource(migration).getContentAsString(StandardCharsets.UTF_8);
        boolean autoCommitOriginal = connection.getAutoCommit();
        connection.setAutoCommit(false);
        try
        {
            try (Statement statement = connection.createStatement())
            {
                statement.execute(sql);
            }
            try (PreparedStatement registro = connection.prepareStatement("INSERT INTO schema_migrations(version) VALUES (?)"))
            {
                registro.setString(1, migration);
                registro.executeUpdate();
            }
            connection.commit();
        }
        catch (Exception ex)
        {
            connection.rollback();
            throw new IllegalStateException("Falha ao aplicar migration " + migration, ex);
        }
        finally
        {
            connection.setAutoCommit(autoCommitOriginal);
        }
    }
}
