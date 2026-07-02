package unoeste.projetoasilo.db.util;

import io.github.cdimascio.dotenv.Dotenv;

import java.net.URI;
import java.sql.*;

public class Banco
{
    private Connection connect;

    private static final Dotenv DOTENV = Dotenv.configure()
            .ignoreIfMissing()
            .load();

    private static final String url = valorConfiguracao("DB_URL", "jdbc:postgresql://localhost/abrigovicentinodb");
    private static final String usuario = valorConfiguracao("DB_USERNAME", "postgres");
    private static final String senha = valorConfiguracao("DB_PASSWORD", "");
    private String erro;

    private Banco()
    {
        connect = null;
        erro = "";
    }

    private void conectar()
    {
        try
        {
            String jdbcDatabaseUrl = valorConfiguracao("JDBC_DATABASE_URL", "");
            if (!jdbcDatabaseUrl.isBlank())
            {
                connect = DriverManager.getConnection(jdbcDatabaseUrl, usuario, senha);
                return;
            }

            String databaseUrl = valorConfiguracao("DATABASE_URL", "");
            if (!databaseUrl.isBlank())
            {
                ConnectionConfig config = configPorDatabaseUrl(databaseUrl);
                connect = DriverManager.getConnection(config.url(), config.usuario(), config.senha());
                return;
            }

            connect = DriverManager.getConnection(url, usuario, senha);
        }
        catch (SQLException sqlex)
        {
            erro = "Impossivel conectar com a base de dados: " + sqlex;
        }
    }

    public static Banco getConnection()
    {
        Banco banco = new Banco();
        banco.conectar();
        return banco;
    }

    public void fechar()
    {
        try
        {
            if (connect != null && !connect.isClosed())
            {
                connect.close();
            }
        }
        catch (SQLException sqlex)
        {
            erro = "Erro ao fechar conexao: " + sqlex;
        }
        finally
        {
            connect = null;
        }
    }

    public boolean manipular(String sql)
    {
        boolean manipulou = false;
        try
        {
            if (connect == null || connect.isClosed())
            {
                conectar();
            }
            if (connect == null)
            {
                return false;
            }
            Statement statement = connect.createStatement();
            int linhasAfetadas = statement.executeUpdate(sql);
            if (linhasAfetadas > 0)
            {
                manipulou = true;
            }
            statement.close();
        }
        catch (SQLException sqlex)
        {
            erro = "Erro: " + sqlex;
        }
        return manipulou;
    }

    public ResultSet consultar(String sql)
    {
        ResultSet rs = null;
        try
        {
            if (connect == null || connect.isClosed())
            {
                conectar();
            }
            if (connect == null)
            {
                return null;
            }
            Statement statement = connect.createStatement();
            rs = statement.executeQuery(sql);
        }
        catch (SQLException sqlex)
        {
            erro = "Erro: " + sqlex;
        }
        return rs;
    }

    public PreparedStatement preparar(String sql) throws SQLException
    {
        if (connect == null || connect.isClosed())
        {
            conectar();
        }
        if (connect == null)
        {
            throw new SQLException(erro);
        }
        return connect.prepareStatement(sql);
    }

    public PreparedStatement prepararComChaves(String sql) throws SQLException
    {
        if (connect == null || connect.isClosed())
        {
            conectar();
        }
        if (connect == null)
        {
            throw new SQLException(erro);
        }
        return connect.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
    }

    public int getMaxPK(String tabela, String chave)
    {
        int max = 0;
        String sql = "select max(" + chave + ") from " + tabela;
        try
        {
            ResultSet rs = consultar(sql);
            if (rs != null && rs.next())
            {
                max = rs.getInt(1);
            }
        }
        catch (SQLException sqlex)
        {
            erro = "Erro: " + sqlex;
            max = -1;
        }
        return max;
    }

    public String getMensagemErro()
    {
        return erro;
    }

    private static String valorConfiguracao(String nome, String padrao)
    {
        String valor = System.getenv(nome);
        if (valor == null || valor.isBlank())
        {
            valor = DOTENV.get(nome);
        }
        if (valor == null || valor.isBlank())
        {
            return padrao;
        }
        return valor.trim();
    }

    private static ConnectionConfig configPorDatabaseUrl(String databaseUrl)
    {
        if (databaseUrl.startsWith("jdbc:"))
        {
            return new ConnectionConfig(databaseUrl, usuario, senha);
        }

        URI uri = URI.create(databaseUrl);
        String userInfo = uri.getUserInfo() == null ? "" : uri.getUserInfo();
        String[] usuarioSenha = userInfo.split(":", 2);
        String host = uri.getHost();
        int porta = uri.getPort() > 0 ? uri.getPort() : 5432;
        String banco = uri.getPath() == null ? "" : uri.getPath().replaceFirst("^/", "");
        String query = uri.getQuery() == null || uri.getQuery().isBlank() ? "" : "?" + uri.getQuery();
        String jdbcUrl = "jdbc:postgresql://" + host + ":" + porta + "/" + banco + query;
        String usuario = usuarioSenha.length > 0 ? usuarioSenha[0] : "";
        String senha = usuarioSenha.length > 1 ? usuarioSenha[1] : "";
        return new ConnectionConfig(jdbcUrl, usuario, senha);
    }

    private record ConnectionConfig(String url, String usuario, String senha)
    {
    }
}
