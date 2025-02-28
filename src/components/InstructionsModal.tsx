import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadButton } from './ui/DownloadButton';
import { AudioPlayer } from './ui/AudioPlayer';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent modal from closing
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Autismus - Comunicação Aumentativa e Alternativa para o Autismo</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="prose prose-blue max-w-none">
                <div className="mb-6">
                  <AudioPlayer audioSrc="/audio/instructions.mp3" />
                </div>

                <h2 className="text-2xl font-bold mb-4">Sobre o Autismus</h2>
                <p className="text-gray-600 leading-relaxed">
                  <strong>Autismus</strong> é uma ferramenta abrangente desenvolvida para facilitar a comunicação de indivíduos não verbais, especialmente crianças, jovens e adultos no espectro do autismo. Projetado para atender às necessidades de pais, cuidadores e profissionais, o aplicativo oferece um conjunto extenso de recursos, incluindo uma biblioteca rica de imagens, funcionalidade offline e um design intuitivo para maximizar a acessibilidade e usabilidade.
                </p>

                <p className="text-gray-600 mt-4">
                  A aplicação permite a criação de um <strong>Sistema de Comunicação Aumentativa e Alternativa (CAA)</strong>, onde imagens personalizadas ajudam os usuários a expressar pensamentos e desejos de forma clara e estruturada. Baseado na estrutura <strong>SVO (Sujeito – Verbo – Objeto)</strong>, o Autismus facilita a construção de frases simples e diretas, como:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <p className="text-green-600">✅ <strong>Eu Quero Brincar.</strong> <em>(Sujeito: Eu / Verbo: Quero / Ação: Brincar)</em></p>
                  <p className="text-green-600 mt-2">✅ <strong>Eu Quero Comer Maçã.</strong> <em>(Sujeito: Eu / Verbo: Quero / Ação: Comer / Objeto: Maçã)</em></p>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4">Funcionalidades Principais</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li><strong>Seleção de Imagens:</strong> Biblioteca organizada por categorias como Ações, Social, Sentimentos, Comida, Lugares, Roupas, entre outras.</li>
                  <li><strong>Criação de Frases:</strong> Combinação de imagens com texto e áudio para formar sentenças significativas.</li>
                  <li><strong>Interação e Feedback:</strong> O aplicativo reproduz o som correspondente à imagem selecionada, reforçando a associação visual e auditiva.</li>
                  <li><strong>Personalização:</strong> Possibilidade de adicionar imagens próprias via computador ou URL e editar o texto ou som associado para melhor adaptação ao usuário.</li>
                  <li><strong>Suporte a Imagens PECs:</strong> O Autismus permite importar imagens adicionais para uma experiência ainda mais completa.</li>
                </ul>

                <h2 className="text-xl font-bold mt-8 mb-4">Quer adicionar imagens extras?</h2>
                <p className="list-disc pl-6 space-y-2 text-gray-600">
                  Sem problema! A aplicação permite importar imagens para enriquecer ainda mais a comunicação.
                </p>

                <p className="text-gray-600 font-medium mb-2">É simples:</p>
                <ol className="list-decimal pl-6 space-y-2 text-gray-600">
                  <li>Clique no cartão: Nova Categoria;</li>
                  <li>Escreva a nova categoria, e clique no botão "Criar Categoria";</li>
                  <li>Aparece um novo cartão com a categoria criada;</li>
                  <li>Clicar no botão "Adicionar Cartão", atribua um nome, clique no botão "Arquivo" e depois escolher a imagem pretendida no seu computador;</li>
                  <li>O Botão "Upload em massa", permite importar várias imagens;</li>
                  <li>Pronto! As imagens já estão disponíveis para serem usadas na comunicação!</li>
                </ol>

                <h2 className="text-xl font-bold mt-8 mb-4">Em conclusão, o nosso Compromisso</h2>
                <p className="text-gray-600">
                  Acreditamos que toda pessoa no Transtorno do Espectro do Autismo (TEA) tem o direito à comunicação plena, inclusão e respeito às suas singularidades.
                </p>
                <p className="text-gray-600 mt-4">
                  Por isso, <strong>Autismus</strong> foi desenvolvido para proporcionar um ambiente acolhedor e uma ferramenta eficaz que promove a autonomia e a valorização das capacidades individuais. O objetivo é fortalecer a interação entre cuidadores, terapeutas e crianças, respeitando as necessidades de cada usuário.
                </p>

                <div className="bg-red-50 p-4 rounded-lg mt-6">
                  <p className="text-red-600">
                    <strong>Importante:</strong> A reprodução, distribuição ou uso não autorizado deste sistema é estritamente proibido sem consulta prévia aos seus criadores. Todas as imagens usadas na aplicação foram geradas por inteligência artificial, assim como a voz da aplicação.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-6">
                  <p className="text-blue-600">
                    <strong>Juntos, construímos caminhos para uma comunicação mais livre, autêntica e inclusiva.</strong>
                  </p>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4">Desenvolvimento</h2>
                <p className="text-gray-600">
                  <strong>Desenvolvedores Full Stack AI:</strong>
                </p>
                <p className="text-gray-600 font-medium">
                  <strong>Patrício Brito & Pedro Deleu</strong> 2025 © Todos os direitos reservados.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
