export function validateServiceInput(input) {
    if (!input?.name?.trim()) {
        throw new Error("Nome é obrigatório");
    }
}