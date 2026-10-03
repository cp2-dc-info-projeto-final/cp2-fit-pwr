export interface Exercicio {
  id_exercicio: number;
  nome: string;
  grupo_muscular: string;
  descricao?: string;
  imagem?: string;
}

export interface ExercicioFormData {
  id_exercicio?: number; 
  nome: string;
  grupo_muscular: string;
  descricao: string;
  imagem: string;
}