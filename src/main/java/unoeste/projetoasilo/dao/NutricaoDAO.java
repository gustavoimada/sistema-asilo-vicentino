package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.EvolucaoNutricional;
import unoeste.projetoasilo.entities.Funcionario;
import unoeste.projetoasilo.entities.Morador;
import unoeste.projetoasilo.entities.ProntuarioNutricional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class NutricaoDAO
{
    public ProntuarioNutricional buscarProntuarioPorMorador(int idMorador, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT p.*, f.nome AS nutricionista_nome, f.categoria AS nutricionista_categoria
                FROM prontuario_nutricional p
                JOIN funcionario f ON f.idfuncionario = p.nutricionista_id
                WHERE p.morador_id = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, idMorador);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return montarProntuario(rs);
                }
            }
        }
        return null;
    }

    public ProntuarioNutricional buscarProntuarioPorId(int idProntuario, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT p.*, f.nome AS nutricionista_nome, f.categoria AS nutricionista_categoria
                FROM prontuario_nutricional p
                JOIN funcionario f ON f.idfuncionario = p.nutricionista_id
                WHERE p.idprontuario = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, idProntuario);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return montarProntuario(rs);
                }
            }
        }
        return null;
    }

    public ProntuarioNutricional salvarProntuario(ProntuarioNutricional prontuario, Banco conexao) throws SQLException
    {
        String sql = """
                INSERT INTO prontuario_nutricional (
                    morador_id, nutricionista_id, acamado, metodo_medicao, grupo_equacao,
                    altura_joelho_cm, circunferencia_braco_cm, peso_kg, altura_cm, imc,
                    peso_estimado, altura_estimada, formula_peso, formula_altura, diagnostico_inicial)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING idprontuario
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, prontuario.getMorador().getIdMorador());
            ps.setInt(2, prontuario.getNutricionista().getIdFuncionario());
            ps.setBoolean(3, prontuario.isAcamado());
            ps.setString(4, prontuario.getMetodoMedicao());
            setStringOuNull(ps, 5, prontuario.getGrupoEquacao());
            setBigDecimalOuNull(ps, 6, prontuario.getAlturaJoelhoCm());
            setBigDecimalOuNull(ps, 7, prontuario.getCircunferenciaBracoCm());
            ps.setBigDecimal(8, prontuario.getPesoKg());
            ps.setBigDecimal(9, prontuario.getAlturaCm());
            ps.setBigDecimal(10, calcularImc(prontuario.getPesoKg(), prontuario.getAlturaCm()));
            ps.setBoolean(11, prontuario.isPesoEstimado());
            ps.setBoolean(12, prontuario.isAlturaEstimada());
            setStringOuNull(ps, 13, prontuario.getFormulaPeso());
            setStringOuNull(ps, 14, prontuario.getFormulaAltura());
            ps.setString(15, prontuario.getDiagnosticoInicial());

            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    prontuario.setIdProntuario(rs.getInt("idprontuario"));
                }
            }
        }

        new MoradorDAO().atualizarAntropometria(
                prontuario.getMorador().getIdMorador(),
                prontuario.getPesoKg(),
                prontuario.getAlturaCm(),
                conexao
        );

        return buscarProntuarioPorId(prontuario.getIdProntuario(), conexao);
    }

    public EvolucaoNutricional salvarEvolucao(EvolucaoNutricional evolucao, int idMorador, Banco conexao) throws SQLException
    {
        BigDecimal imc = evolucao.getPesoKg() != null && evolucao.getAlturaCm() != null
                ? calcularImc(evolucao.getPesoKg(), evolucao.getAlturaCm())
                : null;

        String sql = """
                INSERT INTO evolucao_nutricional (
                    prontuario_id, nutricionista_id, evolucao, peso_kg, altura_cm, imc, metodo_medicao, observacoes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                RETURNING idevolucao
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, evolucao.getProntuarioId());
            ps.setInt(2, evolucao.getNutricionista().getIdFuncionario());
            ps.setString(3, evolucao.getEvolucao());
            setBigDecimalOuNull(ps, 4, evolucao.getPesoKg());
            setBigDecimalOuNull(ps, 5, evolucao.getAlturaCm());
            setBigDecimalOuNull(ps, 6, imc);
            setStringOuNull(ps, 7, evolucao.getMetodoMedicao());
            setStringOuNull(ps, 8, evolucao.getObservacoes());

            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    evolucao.setIdEvolucao(rs.getInt("idevolucao"));
                }
            }
        }

        if (evolucao.getPesoKg() != null && evolucao.getAlturaCm() != null)
        {
            new MoradorDAO().atualizarAntropometria(idMorador, evolucao.getPesoKg(), evolucao.getAlturaCm(), conexao);
        }

        return buscarEvolucaoPorId(evolucao.getIdEvolucao(), conexao);
    }

    public ProntuarioNutricional atualizarProntuario(ProntuarioNutricional prontuario, Banco conexao) throws SQLException
    {
        String sql = """
                UPDATE prontuario_nutricional
                SET acamado = FALSE, metodo_medicao = 'AFERIDO', grupo_equacao = NULL,
                    altura_joelho_cm = NULL, circunferencia_braco_cm = NULL,
                    peso_kg = ?, altura_cm = ?, imc = ?, peso_estimado = FALSE,
                    altura_estimada = FALSE, formula_peso = NULL, formula_altura = NULL,
                    diagnostico_inicial = ?, atualizado_em = CURRENT_TIMESTAMP
                WHERE idprontuario = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setBigDecimal(1, prontuario.getPesoKg());
            ps.setBigDecimal(2, prontuario.getAlturaCm());
            ps.setBigDecimal(3, calcularImc(prontuario.getPesoKg(), prontuario.getAlturaCm()));
            ps.setString(4, prontuario.getDiagnosticoInicial());
            ps.setInt(5, prontuario.getIdProntuario());
            ps.executeUpdate();
        }

        new MoradorDAO().atualizarAntropometria(
                prontuario.getMorador().getIdMorador(), prontuario.getPesoKg(), prontuario.getAlturaCm(), conexao);
        return buscarProntuarioPorId(prontuario.getIdProntuario(), conexao);
    }

    public boolean excluirProntuario(int idProntuario, Banco conexao) throws SQLException
    {
        Connection jdbc = conexao.conexaoJdbc();
        boolean autoCommitAnterior = jdbc.getAutoCommit();
        try
        {
            jdbc.setAutoCommit(false);
            try (PreparedStatement ps = conexao.preparar("DELETE FROM evolucao_nutricional WHERE prontuario_id = ?"))
            {
                ps.setInt(1, idProntuario);
                ps.executeUpdate();
            }
            int removidos;
            try (PreparedStatement ps = conexao.preparar("DELETE FROM prontuario_nutricional WHERE idprontuario = ?"))
            {
                ps.setInt(1, idProntuario);
                removidos = ps.executeUpdate();
            }
            jdbc.commit();
            return removidos > 0;
        }
        catch (SQLException e)
        {
            jdbc.rollback();
            throw e;
        }
        finally
        {
            jdbc.setAutoCommit(autoCommitAnterior);
        }
    }

    public EvolucaoNutricional atualizarEvolucao(EvolucaoNutricional evolucao, int idMorador, Banco conexao) throws SQLException
    {
        BigDecimal imc = evolucao.getPesoKg() != null && evolucao.getAlturaCm() != null
                ? calcularImc(evolucao.getPesoKg(), evolucao.getAlturaCm()) : null;
        String sql = """
                UPDATE evolucao_nutricional
                SET evolucao = ?, peso_kg = ?, altura_cm = ?, imc = ?, metodo_medicao = ?, observacoes = ?
                WHERE idevolucao = ?
                """;
        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setString(1, evolucao.getEvolucao());
            setBigDecimalOuNull(ps, 2, evolucao.getPesoKg());
            setBigDecimalOuNull(ps, 3, evolucao.getAlturaCm());
            setBigDecimalOuNull(ps, 4, imc);
            setStringOuNull(ps, 5, evolucao.getMetodoMedicao());
            setStringOuNull(ps, 6, evolucao.getObservacoes());
            ps.setInt(7, evolucao.getIdEvolucao());
            ps.executeUpdate();
        }
        if (evolucao.getPesoKg() != null && evolucao.getAlturaCm() != null)
        {
            new MoradorDAO().atualizarAntropometria(idMorador, evolucao.getPesoKg(), evolucao.getAlturaCm(), conexao);
        }
        return buscarEvolucaoPorId(evolucao.getIdEvolucao(), conexao);
    }

    public boolean excluirEvolucao(int idEvolucao, Banco conexao) throws SQLException
    {
        try (PreparedStatement ps = conexao.preparar("DELETE FROM evolucao_nutricional WHERE idevolucao = ?"))
        {
            ps.setInt(1, idEvolucao);
            return ps.executeUpdate() > 0;
        }
    }

    public List<EvolucaoNutricional> listarEvolucoes(int idProntuario, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT e.*, f.nome AS nutricionista_nome, f.categoria AS nutricionista_categoria
                FROM evolucao_nutricional e
                JOIN funcionario f ON f.idfuncionario = e.nutricionista_id
                WHERE e.prontuario_id = ?
                ORDER BY e.criado_em DESC
                """;

        List<EvolucaoNutricional> evolucoes = new ArrayList<>();
        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, idProntuario);
            try (ResultSet rs = ps.executeQuery())
            {
                while (rs.next())
                {
                    evolucoes.add(montarEvolucao(rs));
                }
            }
        }
        return evolucoes;
    }

    public EvolucaoNutricional buscarEvolucaoPorId(int idEvolucao, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT e.*, f.nome AS nutricionista_nome, f.categoria AS nutricionista_categoria
                FROM evolucao_nutricional e
                JOIN funcionario f ON f.idfuncionario = e.nutricionista_id
                WHERE e.idevolucao = ?
                """;

        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setInt(1, idEvolucao);
            try (ResultSet rs = ps.executeQuery())
            {
                if (rs.next())
                {
                    return montarEvolucao(rs);
                }
            }
        }
        return null;
    }

    private ProntuarioNutricional montarProntuario(ResultSet rs) throws SQLException
    {
        ProntuarioNutricional prontuario = new ProntuarioNutricional();
        Morador morador = new Morador();
        morador.setIdMorador(rs.getInt("morador_id"));
        Funcionario nutricionista = montarFuncionario(rs);

        prontuario.setIdProntuario(rs.getInt("idprontuario"));
        prontuario.setMorador(morador);
        prontuario.setNutricionista(nutricionista);
        prontuario.setAcamado(rs.getBoolean("acamado"));
        prontuario.setMetodoMedicao(rs.getString("metodo_medicao"));
        prontuario.setGrupoEquacao(rs.getString("grupo_equacao"));
        prontuario.setAlturaJoelhoCm(rs.getBigDecimal("altura_joelho_cm"));
        prontuario.setCircunferenciaBracoCm(rs.getBigDecimal("circunferencia_braco_cm"));
        prontuario.setPesoKg(rs.getBigDecimal("peso_kg"));
        prontuario.setAlturaCm(rs.getBigDecimal("altura_cm"));
        prontuario.setImc(rs.getBigDecimal("imc"));
        prontuario.setPesoEstimado(rs.getBoolean("peso_estimado"));
        prontuario.setAlturaEstimada(rs.getBoolean("altura_estimada"));
        prontuario.setFormulaPeso(rs.getString("formula_peso"));
        prontuario.setFormulaAltura(rs.getString("formula_altura"));
        prontuario.setDiagnosticoInicial(rs.getString("diagnostico_inicial"));
        prontuario.setCriadoEm(rs.getTimestamp("criado_em").toLocalDateTime());
        prontuario.setAtualizadoEm(rs.getTimestamp("atualizado_em").toLocalDateTime());
        return prontuario;
    }

    private EvolucaoNutricional montarEvolucao(ResultSet rs) throws SQLException
    {
        EvolucaoNutricional evolucao = new EvolucaoNutricional();
        evolucao.setIdEvolucao(rs.getInt("idevolucao"));
        evolucao.setProntuarioId(rs.getInt("prontuario_id"));
        evolucao.setNutricionista(montarFuncionario(rs));
        evolucao.setEvolucao(rs.getString("evolucao"));
        evolucao.setPesoKg(rs.getBigDecimal("peso_kg"));
        evolucao.setAlturaCm(rs.getBigDecimal("altura_cm"));
        evolucao.setImc(rs.getBigDecimal("imc"));
        evolucao.setMetodoMedicao(rs.getString("metodo_medicao"));
        evolucao.setObservacoes(rs.getString("observacoes"));
        evolucao.setCriadoEm(rs.getTimestamp("criado_em").toLocalDateTime());
        return evolucao;
    }

    private Funcionario montarFuncionario(ResultSet rs) throws SQLException
    {
        Funcionario funcionario = new Funcionario();
        funcionario.setIdFuncionario(rs.getInt("nutricionista_id"));
        funcionario.setNome(rs.getString("nutricionista_nome"));
        funcionario.setCategoria(rs.getString("nutricionista_categoria"));
        return funcionario;
    }

    private BigDecimal calcularImc(BigDecimal pesoKg, BigDecimal alturaCm)
    {
        BigDecimal alturaMetros = alturaCm.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP);
        return pesoKg.divide(alturaMetros.multiply(alturaMetros), 2, RoundingMode.HALF_UP);
    }

    private void setBigDecimalOuNull(PreparedStatement ps, int indice, BigDecimal valor) throws SQLException
    {
        if (valor == null)
        {
            ps.setNull(indice, Types.NUMERIC);
            return;
        }
        ps.setBigDecimal(indice, valor);
    }

    private void setStringOuNull(PreparedStatement ps, int indice, String valor) throws SQLException
    {
        if (valor == null || valor.isBlank())
        {
            ps.setNull(indice, Types.VARCHAR);
            return;
        }
        ps.setString(indice, valor);
    }
}
