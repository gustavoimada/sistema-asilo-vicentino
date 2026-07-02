package unoeste.projetoasilo.entities;

import java.time.LocalDate;

public class Noticia {
    private int idNoticia;
    private String titulo;
    private String descricao;
    private String nomeImagem;
    private String imagemCaminho;
    private LocalDate dataUpload;
    private String categoria;

    public Noticia() {
    }

    public Noticia(int idNoticia, String titulo, String descricao, String nomeImagem, String imagemCaminho, LocalDate dataUpload, String categoria) {
        this.idNoticia = idNoticia;
        this.titulo = titulo;
        this.descricao = descricao;
        this.nomeImagem = nomeImagem;
        this.imagemCaminho = imagemCaminho;
        this.dataUpload = dataUpload;
        this.categoria = categoria;
    }

    public int getIdNoticia() {
        return idNoticia;
    }

    public void setIdNoticia(int idNoticia) {
        this.idNoticia = idNoticia;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getNomeImagem() {
        return nomeImagem;
    }

    public void setNomeImagem(String nomeImagem) {
        this.nomeImagem = nomeImagem;
    }

    public String getImagemCaminho() {
        return imagemCaminho;
    }

    public void setImagemCaminho(String imagemCaminho) {
        this.imagemCaminho = imagemCaminho;
    }

    public LocalDate getDataUpload() {
        return dataUpload;
    }

    public void setDataUpload(LocalDate dataUpload) {
        this.dataUpload = dataUpload;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
}
