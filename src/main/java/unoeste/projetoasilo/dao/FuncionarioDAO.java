package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.User;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class FuncionarioDAO
{
    private static final String SQL_SELECT = """
            SELECT idfuncionario, nome, cpf, telefone, categoria, ativo, User_idUser
            FROM funcionario
            """;

    public boolean gravar(Funcionario funcionario, Banco conexao) throws SQLException
    {
        String sql = """
                INSERT INTO funcionario (nome, cpf, telefone, categoria, User_idUser)
                VALUES (?, ?, ?, ?, ?)
                """;

        try (PreparedStatement ps = conexao.prepararComChaves(sql))
        {
            ps.setString(1, funcionario.getNome());
            ps.setString(2, funcionario.getCpf());
            ps.setString(3, funcionario.getTelefone());
            ps.setString(4, funcionario.getCategoria());
            ps.setInt(5, funcionario.getIdUser());

            if (ps.executeUpdate() <= 0)
            {
                return false;
            }

            try (ResultSet chaves = ps.getGeneratedKeys())
            {
                if (chaves.next())
                {
                    funcionario.setIdFuncionario(chaves.getInt(1));
                }
            }
        }

        return true;
    }

    public boolean editar(Funcionario funcionario, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE funcionario
                SET nome = ?, cpf = ?, telefone = ?, categoria = ?
                WHERE idfuncionario = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setString(1, funcionario.getNome());
            ps.setString(2, funcionario.getCpf());
            ps.setString(3, funcionario.getTelefone());
            ps.setString(4, funcionario.getCategoria());
            ps.setInt(5, funcionario.getIdFuncionario());
            return ps.executeUpdate() > 0;
        }
    }

    public boolean deletar(int id, Banco conexao) throws SQLException
    {
        String sql = "DELETE FROM funcionario WHERE idfuncionario = ?";

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public boolean desativar(int id, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE funcionario
                SET ativo = FALSE
                WHERE idfuncionario = ?
                AND ativo = TRUE
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    public int contarEscalasFuturasOuAtivas(int id, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT COUNT(*)
                FROM funcionarioturnos
                WHERE Funcionario_idFuncionario = ?
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

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return rs.getInt(1);
                }
            }
        }

        return 0;
    }

    public int contarAtivosPorCategoria(String categoria, Banco conexao) throws SQLException
    {
        String filtroCategoria = filtroCategoria(categoria);
        if (filtroCategoria.isBlank())
        {
            return 0;
        }

        String sql = """
                SELECT COUNT(*)
                FROM funcionario
                WHERE ativo = TRUE
                  AND LOWER(categoria) LIKE ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setString(1, filtroCategoria);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return rs.getInt(1);
                }
            }
        }

        return 0;
    }

    public List<Funcionario> listar(Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + """
                WHERE ativo = TRUE
                ORDER BY idfuncionario
                """;
        return listarPorSql(sql, List.of(), conexao);
    }

    public List<Funcionario> listarPorCategoria(String categoria, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + """
                WHERE categoria = ?
                AND ativo = TRUE
                ORDER BY idfuncionario
                """;
        List<Object> params = new ArrayList<>();
        params.add(categoria);
        return listarPorSql(sql, params, conexao);
    }

    public Funcionario buscarPorId(int id, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + " WHERE idfuncionario = ?";

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return popularFuncionario(rs);
                }
            }
        }

        return null;
    }

    public Funcionario buscarPorNome(String nome, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + """
                WHERE LOWER(nome) = LOWER(?)
                AND ativo = TRUE
                ORDER BY idfuncionario
                LIMIT 1
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setString(1, nome);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return popularFuncionario(rs);
                }
            }
        }

        return null;
    }

    public Funcionario buscarPorUsuarioId(int idUser, Banco conexao) throws SQLException
    {
        String sql = SQL_SELECT + """
                WHERE User_idUser = ?
                AND ativo = TRUE
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, idUser);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return popularFuncionario(rs);
                }
            }
        }

        return null;
    }

    public boolean buscarPorCpf(String cpf, Banco conexao) throws SQLException
    {
        return existePorCampo("cpf", cpf, null, conexao);
    }

    public boolean buscarPorTelefone(String telefone, Banco conexao) throws SQLException
    {
        return existePorCampo("telefone", telefone, null, conexao);
    }

    public boolean buscarPorTelefoneExcluindoId(String telefone, int id, Banco conexao) throws SQLException
    {
        return existePorCampo("telefone", telefone, id, conexao);
    }

    private boolean existePorCampo(String campo, String valor, Integer idIgnorado, Banco conexao) throws SQLException
    {
        String sql = "SELECT idfuncionario FROM funcionario WHERE " + campo + " = ?";
        if (idIgnorado != null)
        {
            sql += " AND idfuncionario <> ?";
        }

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setString(1, valor);
            if (idIgnorado != null)
            {
                ps.setInt(2, idIgnorado);
            }

            try (ResultSet rs = ps.executeQuery())
            {
                return rs.next();
            }
        }
    }

    private List<Funcionario> listarPorSql(String sql, List<Object> params, Banco conexao) throws SQLException
    {
        List<Funcionario> funcionarios = new ArrayList<>();

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            for (int i = 0; i < params.size(); i++)
            {
                ps.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = ps.executeQuery())
            {
                while (rs.next())
                {
                    funcionarios.add(popularFuncionario(rs));
                }
            }
        }

        return funcionarios;
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
        funcionario.setTelefone(rs.getString("telefone"));
        funcionario.setCategoria(rs.getString("categoria"));
        funcionario.setAtivo(rs.getBoolean("ativo"));
        return funcionario;
    }

    private String filtroCategoria(String categoria)
    {
        if (categoria == null)
        {
            return "";
        }

        String valor = categoria.trim().toLowerCase();
        if (valor.startsWith("coord"))
        {
            return "coordenador%";
        }
        if (valor.startsWith("cuidad"))
        {
            return "cuidador%";
        }
        if (valor.startsWith("secret"))
        {
            return "secret%";
        }

        return "";
    }
}
