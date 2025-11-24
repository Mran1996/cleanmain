/**
 * Example Test: React Component
 * 
 * This demonstrates how to test React components.
 * Tests verify that components render correctly and handle user interactions.
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Example: Testing a simple button component
// In a real scenario, you'd test your actual components
function ExampleButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} data-testid="example-button">
      {children}
    </button>
  )
}

describe('ExampleButton Component', () => {
  it('should render button with text', () => {
    render(<ExampleButton onClick={() => {}}>Click me</ExampleButton>)
    
    const button = screen.getByTestId('example-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click me')
  })

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<ExampleButton onClick={handleClick}>Click me</ExampleButton>)
    
    const button = screen.getByTestId('example-button')
    button.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render children correctly', () => {
    render(
      <ExampleButton onClick={() => {}}>
        <span>Custom content</span>
      </ExampleButton>
    )
    
    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })
})

/**
 * REAL EXAMPLE: How you would test your actual components
 * 
 * Example for testing a component from your app:
 * 
 * import { Navigation } from '@/components/navigation'
 * 
 * describe('Navigation Component', () => {
 *   it('should render navigation links', () => {
 *     render(<Navigation />)
 *     expect(screen.getByText('Home')).toBeInTheDocument()
 *     expect(screen.getByText('Features')).toBeInTheDocument()
 *   })
 * 
 *   it('should navigate when link is clicked', () => {
 *     render(<Navigation />)
 *     const homeLink = screen.getByText('Home')
 *     homeLink.click()
 *     // Verify navigation happened
 *   })
 * })
 */

