import { useState } from 'react';
import ProductGrid from '../components/pos/ProductGrid';
import ProductFormModal from '../components/modals/ProductFormModal';

export default function POSView({ searchQuery }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const openModal = (product = null) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-hidden p-5 flex flex-col h-full">
      <ProductGrid searchQuery={searchQuery} onOpenProductModal={openModal} />
      {modalOpen && (
        <ProductFormModal
          product={editProduct}
          onClose={() => {
            setModalOpen(false);
            setEditProduct(null);
          }}
        />
      )}
    </div>
  );
}
