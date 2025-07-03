// components/global/Footer.tsx (ou onde você preferir organizar seus componentes)

import Link from 'next/link';
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Pega o ano atual dinamicamente
  const url = "https://dossantosdev.com.br/"
  return (
    <footer className="bg-background/95 text-muted-foreground p-4 text-center mt-8 border-t">
      <p className="text-sm">
        &copy; {currentYear} OnTech. Todos os direitos reservados.
      </p>
      <p className='text-xs mt-1'> Desenvolvido por 
        <Link target='_blank' className='hover:text-primary duration-300 transition-all ml-1' href={url} >
        DosSantosdev
        </Link>
      </p>
    </footer>
  );
}

export {Footer}