import React from 'react';
import Modal from './Modal';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onAction={onConfirm}
      title="EXIT SESSION?"
      icon="🏃"
      actionLabel="YES, LOGOUT"
    >
      Are you sure you want to sign out? You will need to enter your credentials again to manage torrents.
    </Modal>
  );
}
