package unoeste.projetoasilo.entities;

import unoeste.projetoasilo.dao.TiposDespesasDAO;
import unoeste.projetoasilo.db.util.Banco;

import java.sql.SQLException;
import java.util.List;

public class TiposDespesas {

        private int idtiposDespesas;
        private String tipo;

        public int getIdtiposDespesas() {
            return idtiposDespesas;
        }

        public void setIdtiposDespesas(int idtiposDespesas) {
            this.idtiposDespesas = idtiposDespesas;
        }

        public String getTipo() {
            return tipo;
        }

        public void setTipo(String tipo) {
            this.tipo = tipo;
        }

        public TiposDespesas(int idtiposDespesas, String tipo) {
            this.idtiposDespesas = idtiposDespesas;
            this.tipo = tipo;
        }
        public TiposDespesas() {

        }

        public boolean gravar(Banco conexao) throws SQLException
        {
            TiposDespesasDAO tiposdespesasdao = new TiposDespesasDAO();
            if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposdespesasdao.gravar(this, conexao);
        }

        public boolean editar(Banco conexao) throws SQLException
        {
            TiposDespesasDAO tiposdespesasdao = new TiposDespesasDAO();
            if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposdespesasdao.editar(this, conexao);
        }

        public boolean deletar(Banco conexao) throws SQLException
        {
            TiposDespesasDAO tiposdespesasdao = new TiposDespesasDAO();
            if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposdespesasdao.deletar(this.idtiposDespesas, conexao);
        }

        public TiposDespesas buscarPorId(int id, Banco conexao) throws SQLException
        {
            TiposDespesasDAO tiposdespesasdao = new TiposDespesasDAO();
            if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposdespesasdao.buscarPorId(id, conexao);
        }

        public TiposDespesas buscarPorTipo(String tipo, Banco conexao) throws SQLException
        {
            TiposDespesasDAO tiposdespesasdao = new TiposDespesasDAO();
            if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposdespesasdao.buscarPorTipo(tipo, conexao);
        }

        public List<TiposDespesas> listar(Banco conexao) throws SQLException
        {
            TiposDespesasDAO tiposdespesasdao = new TiposDespesasDAO();
            if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposdespesasdao.listar(conexao);
        }

        public List<TiposDespesas> listarOrdenado(String valor, String ordem, Banco conexao) throws SQLException{
            TiposDespesasDAO tiposdespesasdao = new TiposDespesasDAO();
            if (conexao == null)
        {
            throw new SQLException("Nao foi possivel abrir conexao com banco de dados");
        }
        return tiposdespesasdao.listarOrdenado(valor, ordem, conexao);
        }

}
