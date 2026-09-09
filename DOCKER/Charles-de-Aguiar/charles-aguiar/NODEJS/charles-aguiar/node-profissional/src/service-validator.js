// service-validator.js

// 23.2 Etapa 1 — normalizar dados (Adicionado a pedido do slide)
function normalizeName(value) {
    return value.trim().replace(/\s+/g, " ");
}

export function validarNomeServico(name) {
    if (!name || name.trim() === "") {
        throw new Error("Validação falhou: O nome do serviço não pode ser vazio.");
    }
    return true;
}


export function validatePrice(price) {
    if (typeof price !== 'number' || price <= 0) {
        throw new Error("O preço fornecido é inválido. Deve ser um número maior que zero.");
    }
    return true;
}

// Banco de dados simulado para o exercício 2
const servicosExistentesNoBanco = ["Desenvolvimento Node.js", "Hospedagem Cloud"];

export function validateServiceInputCompleto(input) {
    if (!input?.name) {
        throw new Error("FORMATO_INVALIDO: Nome é obrigatório");
    }

    // Aplicando a normalização de espaços extras
    const name = normalizeName(input.name);
    const price = Number(input?.price);
    const durationMinutes = Number(input?.durationMinutes);

    if (isNaN(price) || price <= 0) {
        throw new Error("FORMATO_INVALIDO: Preço deve ser um número maior que zero");
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
        throw new Error("FORMATO_INVALIDO: Duração deve ser um número inteiro maior que zero");
    }

    return { name, price, durationMinutes };
}
