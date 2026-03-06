-- Remover limite de tamanho dos campos codigo e nome de produtos
ALTER TABLE produtos ALTER COLUMN codigo TYPE TEXT;
ALTER TABLE produtos ALTER COLUMN nome TYPE TEXT;
