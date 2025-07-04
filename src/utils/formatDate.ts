// --- FUNÇÃO DE AJUDA PARA FORMATAR A DATA ---
export const parseDateString = (dateString: string): Date => {
  // Recebe 'DD/MM/YYYY' e converte para 'YYYY-MM-DD'
  const [day, month, year] = dateString.split('/');
  // Cria uma string no formato 'YYYY-MM-DD' que é universalmente aceito pelo construtor Date
  return new Date(`${year}-${month}-${day}`);
};