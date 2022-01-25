/**
 * @jest-environment jsdom
 */

 import "@testing-library/jest-dom";
 import { render } from '@testing-library/svelte';
 import App from '../App.svelte';
 
 describe('App', () => {
   it('It renders the heading', () => {
    const { getByText } = render(App);
    expect(getByText("3D-Box")).toBeInTheDocument()
   });
 });