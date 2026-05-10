// Compara un texto con el termino de busqueda, sin diferenciar
// mayusculas/minusculas ni tildes.
export function coincide(texto: string, termino: string): boolean {
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return normalizar(texto).includes(normalizar(termino.trim()));
}
