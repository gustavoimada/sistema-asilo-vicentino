package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.User;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class FuncionarioDAO
{
    public boolean gravar(Funcionario funcionario, Banco conexao) throws SQLException
    {
        String sql = """
                INSERT INTO funcionario (nome, cpf, ctps_numero, telefone, categoria, User_idUser)
                VALUES ('#1', '#2', '#3', '#4', '#5', #6)
                """;
        sql = sql.replace("#1", escaparSql(funcionario.getNome()));
        sql = sql.replace("#2", escaparSql(funcionario.getCpf()));
        sql = sql.replace("#3", escaparSql(funcionario.getCtps()));
        sql = sql.replace("#4", escaparSql(funcionario.getTelefone()));
        sql = sql.replace("#5", escaparSql(funcionario.getCategoria()));
        sql = sql.replace("#6", String.valueOf(funcionario.getIdUser()));

        if (!conexao.manipular(sql))
        {
            return false;
        }

        int novoId = conexao.getMaxPK("funcionario", "idfuncionario");
        if (novoId > 0)
        {
            funcionario.setIdFuncionario(novoId);
        }
        return true;
    }

    public boolean editar(Funcionario funcionario, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE funcionario
                SET nome = '#1', cpf = '#2', ctps_numero = '#3', telefone = '#4', categoria = '#5'
                WHERE idfuncionario = #6
                """;
        sql = sql.replace("#1", escaparSql(funcionario.getNome()));
        sql = sql.replace("#2", escaparSql(funcionario.getCpf()));
        sql = sql.replace("#3", escaparSql(funcionario.getCtps()));
        sql = sql.replace("#4", escaparSql(funcionario.getTelefone()));
        sql = sql.replace("#5", escaparSql(funcionario.getCategoria()));
        sql = sql.replace("#6", String.valueOf(funcionario.getIdFuncionario()));

        return conexao.manipular(sql);
    }

    public boolean deletar(int id, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM funcionario WHERE idfuncionario = #1";
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public boolean desativar(int id, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE funcionario
                SET ativo = FALSE
                WHERE idfuncionario = #1
                AND ativo = TRUE
                """;
        sql = sql.replace("#1", String.valueOf(id));
        return conexao.manipular(sql);
    }

    public int contarEscalasFuturasOuAtivas(int id, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT COUNT(*)
                FROM funcionarioturnos
                WHERE Funcionario_idFuncionario = #1
                  AND status IN ('pendente', 'ativo')
                  AND (
                        status = 'ativo'
                        OR (
                            dataEscala::timestamp
                            + CASE
                                WHEN Turnos_idTurnos = 2 THEN INTERVAL '1 day 7 hours'
                                ELSE INTERVAL '19 hours'
                              END
                        ) >= CURRENT_TIMESTAMP
                  )
                """;
        sql = sql.replace("#1", String.valueOf(id));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return rs.getInt(1);
        }

        return 0;
    }

    public int contarAtivosPorCategoria(String categoria, Banco conexao) throws SQLException
    {
        String filtroCategoria = filtroSqlCategoria(categoria);
        if (filtroCategoria.isBlank())
        {
            return 0;
        }

        String sql = """
                SELECT COUNT(*)
                FROM funcionario
                WHERE ativo = TRUE
                  AND #FILTRO_CATEGORIA
                """;
        sql = sql.replace("#FILTRO_CATEGORIA", filtroCategoria);

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return rs.getInt(1);
        }

        return 0;
    }

    public List<Funcionario> listar(Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario, nome, cpf, ctps_numero, telefone, categoria, ativo, User_idUser
                FROM funcionario
                WHERE ativo = TRUE
                ORDER BY idfuncionario
                """;
        List<Funcionario> funcionarios = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                funcionarios.add(popularFuncionario(rs));
            }
        }

        return funcionarios;
    }

    public List<Funcionario> listarPorCategoria(String categoria, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario, nome, cpf, ctps_numero, telefone, categoria, ativo, User_idUser
                FROM funcionario
                WHERE categoria = '#1'
                AND ativo = TRUE
                ORDER BY idfuncionario
                """;
        sql = sql.replace("#1", escaparSql(categoria));

        List<Funcionario> funcionarios = new ArrayList<>();
        ResultSet rs = conexao.consultar(sql);

        if (rs != null)
        {
            while (rs.next())
            {
                funcionarios.add(popularFuncionario(rs));
            }
        }

        return funcionarios;
    }

    public Funcionario buscarPorId(int id, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario, nome, cpf, ctps_numero, telefone, categoria, ativo, User_idUser
                FROM funcionario
                WHERE idfuncionario = #1
                """;
        sql = sql.replace("#1", String.valueOf(id));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularFuncionario(rs);
        }

        return null;
    }

    public Funcionario buscarPorNome(String nome, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario, nome, cpf, ctps_numero, telefone, categoria, ativo, User_idUser
                FROM funcionario
                WHERE LOWER(nome) = LOWER('#1')
                AND ativo = TRUE
                ORDER BY idfuncionario
                LIMIT 1
                """;
        sql = sql.replace("#1", escaparSql(nome));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularFuncionario(rs);
        }

        return null;
    }

    public Funcionario buscarPorUsuarioId(int idUser, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario, nome, cpf, ctps_numero, telefone, categoria, ativo, User_idUser
                FROM funcionario
                WHERE User_idUser = #1
                AND ativo = TRUE
                """;
        sql = sql.replace("#1", String.valueOf(idUser));

        ResultSet rs = conexao.consultar(sql);
        if (rs != null && rs.next())
        {
            return popularFuncionario(rs);
        }

        return null;
    }

    public boolean buscarPorCpf(String cpf, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario
                FROM funcionario
                WHERE cpf = '#1'
                """;
        sql = sql.replace("#1", escaparSql(cpf));

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public boolean buscarPorCtps(String ctps, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario
                FROM funcionario
                WHERE ctps_numero = '#1'
                """;
        sql = sql.replace("#1", escaparSql(ctps));

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public boolean buscarPorCtpsExcluindoId(String ctps, int id, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario
                FROM funcionario
                WHERE ctps_numero = '#1' AND idfuncionario <> #2
                """;
        sql = sql.replace("#1", escaparSql(ctps));
        sql = sql.replace("#2", String.valueOf(id));

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public boolean buscarPorTelefone(String telefone, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario
                FROM funcionario
                WHERE telefone = '#1'
                """;
        sql = sql.replace("#1", escaparSql(telefone));

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    public boolean buscarPorTelefoneExcluindoId(String telefone, int id, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT idfuncionario
                FROM funcionario
                WHERE telefone = '#1' AND idfuncionario <> #2
                """;
        sql = sql.replace("#1", escaparSql(telefone));
        sql = sql.replace("#2", String.valueOf(id));

        ResultSet rs = conexao.consultar(sql);
        return rs != null && rs.next();
    }

    private Funcionario popularFuncionario(ResultSet rs) throws SQLException
    {
        User user = new User();
        user.setIdUser(rs.getInt("User_idUser"));

        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(rs.getInt("idfuncionario"));
        funcionario.setUser(user);
        funcionario.setNome(rs.getString("nome"));
        funcionario.setCpf(rs.getString("cpf"));
        funcionario.setCtps(rs.getString("ctps_numero"));
        funcionario.setTelefone(rs.getString("telefone"));
        funcionario.setCategoria(rs.getString("categoria"));
        funcionario.setAtivo(rs.getBoolean("ativo"));
        return funcionario;
    }

    private String escaparSql(String valor)
    {
        if (valor == null)
        {
            return "";
        }

        return valor.replace("'", "''");
    }

    private String filtroSqlCategoria(String categoria)
    {
        if (categoria == null)
        {
            return "";
        }

        String valor = categoria.trim().toLowerCase();
        if (valor.startsWith("coord"))
        {
            return "LOWER(categoria) LIKE 'coordenador%'";
        }
        if (valor.startsWith("cuidad"))
        {
            return "LOWER(categoria) LIKE 'cuidador%'";
        }
        if (valor.startsWith("secret"))
        {
            return "LOWER(categoria) LIKE 'secret%'";
        }

        return "";
    }

}
