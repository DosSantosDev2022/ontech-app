"use client"; // Marca como Client Component

import { getProductByIdFromHygraph } from "@/lib/hygraph"; // Importa a nova função do Hygraph
import { Product } from "@/lib/api-mock"; // Continua importando a interface Product
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery<Product | undefined, Error>({
    queryKey: ["product", productId],
    queryFn: () => getProductByIdFromHygraph(productId),
    enabled: !!productId, // A query só roda se o productId existir
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Spinner size="lg" />
        <p className="ml-2 text-lg">Carregando detalhes do produto...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Header />
        <Alert variant="destructive" className="mt-8">
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>Erro ao carregar produto</AlertTitle>
          <AlertDescription>
            {`Não foi possível carregar os detalhes do produto. Detalhes: ${error?.message || "Erro desconhecido"}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Header /> {/* Adicionado o Header aqui também para consistência */}
        <Alert variant="default" className="mt-8">
          <AlertTitle>Produto não encontrado</AlertTitle>
          <AlertDescription>
            O produto com o ID "{productId}" não foi encontrado.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para a Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header /> {/* Adicione o Header */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/">← Voltar para os Produtos</Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Coluna da Esquerda: Imagem de Capa e Ficha Técnica */}
          <div className="flex flex-col gap-8">
            {/* Imagem de Capa do Produto */}
            <div className="relative w-full aspect-square md:aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
              <Image
                src={product.coverImage || product.imageUrl}
                alt={product.name}
                layout="fill"
                objectFit="contain" // Use "contain" para garantir que a imagem inteira seja visível
                className="object-center"
              />
            </div>

            {/* Ficha Técnica */}
            {product.technicalSpecs && Object.keys(product.technicalSpecs).length > 0 && (
              <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <h2 className="text-2xl font-semibold mb-3">Ficha Técnica</h2>
                <ul className="grid grid-cols-1 gap-y-2 text-gray-800">
                  {Object.entries(product.technicalSpecs).map(([key, value]) => (
                    <li key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1">
                      <span className="font-medium text-gray-600">{key}:</span>
                      <span className="text-right sm:text-left">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Coluna da Direita: Detalhes do Produto e Links de Afiliados */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-extrabold text-primary-foreground mb-2">
              {product.name}
            </h1>
            <p className="text-3xl font-bold text-primary">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              {product.longDescription || product.description}
            </p>

            <Separator className="my-2" />

            {/* Links de Afiliados */}
            {product.affiliateLinks && product.affiliateLinks.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-3">Onde Comprar</h2>
                <div className="flex flex-col gap-3">
                  {product.affiliateLinks.map((link, index) => (
                    <Button key={index} asChild size="lg" className="w-full">
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        Comprar na {link.name}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}