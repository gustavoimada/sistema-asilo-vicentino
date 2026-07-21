package unoeste.projetoasilo.dao;

import unoeste.projetoasilo.db.util.Banco;
import unoeste.projetoasilo.entities.ControleFraldas;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ControleFraldasDAO
{
    public boolean gravar(ControleFraldas controle, Banco conexao) throws SQLException
    {
        String sql = """
                INSERT INTO controle_fraldas
                    (quantidade_pacotes, fraldas_por_pacote, total_fraldas, data_registro, observacao, funcionario_idfuncionario)
                VALUES (?, ?, ?, ?, ?, ?)
                """;

        try (PreparedStatement ps = conexao.prepararComChaves(sql))
        {
            ps.setInt(1, controle.getQuantidadePacotes());
            ps.setInt(2, controle.getFraldasPorPacote());
            ps.setInt(3, controle.getTotalFraldas());
            ps.setDate(4, Date.valueOf(controle.getDataRegistro()));
            if (controle.getObservacao() == null || controle.getObservacao().isBlank()) ps.setNull(5, java.sql.Types.VARCHAR);
            else ps.setString(5, controle.getObservacao().trim());
            if (controle.getIdFuncionario() == null || controle.getIdFuncionario() <= 0) ps.setNull(6, java.sql.Types.INTEGER);
            else ps.setInt(6, controle.getIdFuncionario());

            if (ps.executeUpdate() <= 0) return false;
            try (ResultSet chaves = ps.getGeneratedKeys())
            {
                if (chaves.next()) controle.setIdControleFraldas(chaves.getInt(1));
            }
            return true;
        }
    }

    public List<ControleFraldas> listarNoPeriodo(java.time.LocalDate inicio, java.time.LocalDate fim, Banco conexao) throws SQLException
    {
        String sql = """
                SELECT cf.idcontrolefraldas, cf.quantidade_pacotes, cf.fraldas_por_pacote,
                       cf.total_fraldas, cf.data_registro, cf.observacao, cf.funcionario_idfuncionario,
                       f.nome AS funcionario_nome
                  FROM controle_fraldas cf
             LEFT JOIN funcionario f ON f.idfuncionario = cf.funcionario_idfuncionario
                 WHERE cf.data_registro BETWEEN ? AND ?
              ORDER BY cf.data_registro DESC, cf.idcontrolefraldas DESC
                """;
        List<ControleFraldas> controles = new ArrayList<>();
        try (PreparedStatement ps = conexao.preparar(sql))
        {
            ps.setDate(1, Date.valueOf(inicio));
            ps.setDate(2, Date.valueOf(fim));
            try (ResultSet rs = ps.executeQuery())
            {
                while (rs.next()) controles.add(montar(rs));
            }
        }
        return controles;
    }

    private ControleFraldas montar(ResultSet rs) throws SQLException
    {
        ControleFraldas controle = new ControleFraldas();
        controle.setIdControleFraldas(rs.getInt("idcontrolefraldas"));
        controle.setQuantidadePacotes(rs.getInt("quantidade_pacotes"));
        controle.setFraldasPorPacote(rs.getInt("fraldas_por_pacote"));
        controle.setTotalFraldas(rs.getInt("total_fraldas"));
        controle.setDataRegistro(rs.getDate("data_registro").toLocalDate());
        controle.setObservacao(rs.getString("observacao"));
        Object funcionarioId = rs.getObject("funcionario_idfuncionario");
        controle.setIdFuncionario(funcionarioId == null ? null : ((Number) funcionarioId).intValue());
        controle.setFuncionarioNome(rs.getString("funcionario_nome"));
        return controle;
    }
}
