-- Rode DEPOIS do schema.sql — popula a tabela de produtos
-- com os cartões presente que já existiam no site (loja.html)

USE petisqueira_chicao;

INSERT INTO produtos (nome, valor, imagem) VALUES
  ('Cartão Presente', 100.00, 'imgs/cartao-presente-100.png'),
  ('Cartão Presente', 200.00, 'imgs/cartao-presente-200.png'),
  ('Cartão Presente', 300.00, 'imgs/cartao-presente-300.png'),
  ('Cartão Presente', 400.00, 'imgs/cartao-presente-400.png');
