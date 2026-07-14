(function (global) {
    "use strict";

    const palavrasMenores = new Set([
        "a", "as", "o", "os", "de", "da", "das", "do", "dos", "e", "em", "para", "por", "com", "sem"
    ]);
    const siglas = {
        apae: "APAE",
        cnpj: "CNPJ",
        cpf: "CPF",
        cras: "CRAS",
        creas: "CREAS",
        inss: "INSS",
        mei: "MEI",
        ong: "ONG",
        pix: "PIX",
        sus: "SUS",
        ubs: "UBS"
    };

    global.formatarTituloLegivel = function (valor) {
        const texto = String(valor || "").trim().replace(/\s+/g, " ");
        if (!texto) {
            return "";
        }

        return texto.toLocaleLowerCase("pt-BR").split(" ").map(function (palavra, indice) {
            if (siglas[palavra]) {
                return siglas[palavra];
            }
            if (indice > 0 && palavrasMenores.has(palavra)) {
                return palavra;
            }
            return palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1);
        }).join(" ");
    };
})(window);
