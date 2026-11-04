import '@testing-library/jest-dom'

// Next 14 supplies the server-action hook through its React DOM build.
// jsdom uses stable React 18, so provide the idle boundary for component tests.
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: jest.fn(() => ({ pending: false, data: null, method: null, action: null })),
}))
