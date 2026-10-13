import { useContext } from 'react'
import QAContext from './QAContextBase'

export const useQA = () => {
  const context = useContext(QAContext)
  if (!context) {
    throw new Error('useQA must be used within a QAProvider')
  }
  return context
}
