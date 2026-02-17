'use client';
import React from 'react'
import { Toaster, toast } from 'react-hot-toast'

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '0.5rem',
            border: '1px solid #374151',
            fontSize: '0.875rem',
          },
          success: {
            duration: 3000,
            style: {
              background: '#1f2937',
              border: '1px solid #16a34a',
            },
            iconTheme: {
              primary: '#22c55e',
              secondary: '#1f2937',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#1f2937',
              border: '1px solid #dc2626',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1f2937',
            },
          },
        }}
      />
    </>
  )
}

export { toast }
