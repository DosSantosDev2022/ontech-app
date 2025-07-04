'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCouponsFromHygraph, Coupon } from '@/lib/hygraph'; 
import { parseDateString } from '@/utils/formatDate';

interface CouponItemProps {
  couponCode: string;
  expirationDate: string;
  label: string
}

const CouponItem = ({ couponCode, expirationDate,label }: CouponItemProps) => {
  const [copied, setCopied] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState<'default' | 'destructive'>('default');

  // Converte a string da data de expiração para um objeto Date
  const expiresOn = parseDateString(expirationDate);
  const currentDate = new Date(); // Current date and time in Jundiaí, Brazil: Friday, July 4, 2025 at 11:45:26 AM -03

  // Verifica se o cupom expirou
  const isExpired = expiresOn < currentDate;

  const handleCopyClick = async () => {
    if (isExpired) {
      setAlertMessage('Este cupom expirou e não pode ser copiado.');
      setAlertVariant('destructive');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // Esconde o alerta após 3 segundos
      return; // Impede a cópia se o cupom estiver expirado
    }

    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setAlertMessage('Cupom copiado com sucesso!');
      setAlertVariant('default');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000); // Esconde o alerta após 2 segundos
      setTimeout(() => setCopied(false), 2000); // Reseta o estado do botão
    } catch (err) {
      console.error('Falha ao copiar o cupom:', err);
      setAlertMessage('Erro ao copiar o cupom!');
      setAlertVariant('destructive');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000); // Esconde o alerta após 3 segundos
    }
  };

  // Formata a data de expiração para exibição
  const formattedExpirationDate = expiresOn.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className='flex flex-col gap-2 p-2.5 bg-secondary/20 border rounded-2xl'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-1'>
          <span className='text-sm text-muted-foreground'>{label}</span>
        <span className={`font-semibold text-lg ${isExpired ? 'line-through text-muted-foreground' : ''}`}>
          {couponCode}
        </span>
        </div>
        <Button onClick={handleCopyClick} disabled={copied || isExpired}>
          {copied ? 'Copiado!' : isExpired ? 'Expirado' : 'Copiar'}
        </Button>
      </div>
      <div className='flex items-center gap-1 text-sm text-muted-foreground'>
        {isExpired && <AlertCircleIcon className='h-4 w-4 text-destructive' />}
        <span>
          {isExpired ? (
            <span className='text-destructive'>Expirado em: {formattedExpirationDate}</span>
          ) : (
            `Expira em: ${formattedExpirationDate}`
          )}
        </span>
      </div>
      {showAlert && (
        <Alert variant={alertVariant} className='mt-2'>
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const CouponsDialog = () => {
  // hook useQuery para buscar os cupons
  const {
    data: coupons,
    isLoading,
    isError,
    error,
  } = useQuery<Coupon[]>({
    queryKey: ['coupons'], // Chave única para esta query
    queryFn: getCouponsFromHygraph, // Função que faz a requisição
    staleTime: 1000 * 60 * 5, 
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost'>Cupons</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Meus cupons</DialogTitle>
        </DialogHeader>
        <div className='py-4 max-h-72 overflow-x-auto scrollbar-custom'>
          {isLoading && (
            <p className='text-center text-muted-foreground'>Carregando cupons...</p>
          )}
          {isError && (
            <p className='text-center text-red-500'>
              Erro ao carregar cupons: {error?.message || 'Erro desconhecido'}
            </p>
          )}
          {!isLoading && !isError && coupons && coupons.length > 0 ? (
            coupons.map((coupon) => (
              <CouponItem
                key={coupon.id} // Use o ID do cupom para a chave
                couponCode={coupon.code}
                expirationDate={coupon.expiration}
                label={coupon.label}
              />
            ))
          ) : (!isLoading && !isError && (!coupons || coupons.length === 0)) && (
            <p className='text-center text-muted-foreground'>Nenhum cupom disponível no momento.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { CouponsDialog };