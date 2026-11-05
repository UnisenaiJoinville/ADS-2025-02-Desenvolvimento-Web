// O Express 4 nao captura erros de funcoes async automaticamente.
// Este wrapper encaminha qualquer rejeicao para o middleware de erro.
export function asyncHandler(handler) {
    return (request, response, next) => {
      Promise.resolve(handler(request, response, next)).catch(next);
    };
  }