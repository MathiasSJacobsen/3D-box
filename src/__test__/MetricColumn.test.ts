/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, fireEvent } from "@testing-library/svelte";
import MetricColumnWrapper from "./slotComponentsWorkAround/MetricColumnWrapper.svelte";

describe("Heading", () => {
  test("Tesing the heading", () => {
    const { getByText, container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
    });
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
    expect(getByText("metricValue:")).toBeInTheDocument();
  });
});

describe("Input-field", () => {
  test("It renders", () => {
    const { container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
    });

    const input = <HTMLInputElement>(
      container.querySelector("input[type=number]")
    );
    expect(input).toBeInTheDocument();
  });

  test("It reacts to input", async () => {
    const { container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
    });
    /*
 querySelector gives a HTMLElement but needs to be casted to HTMLInputElement for .value to work
 */
    const input = <HTMLInputElement>(
      container.querySelector("input[type=number]")
    );
    await fireEvent.input(input, { target: { value: 23 } });
    expect(input.value).toBe("23");
  });

  test("It is not disabled on render", () => {
    const {  container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
    });

    const input = <HTMLInputElement>(
      container.querySelector("input[type=number]")
    );
    expect(input).not.toBeDisabled();
  });
});

describe('Searchbar', () => {
  test('It renders', () => {
    const { container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
    });

    const input = <HTMLInputElement>(
      container.querySelector("input[type=text]")
    );
    expect(input).toBeInTheDocument();
  });

  test('It reacts to input', async () => {
    const { container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
    });

    const input = <HTMLInputElement>(
      container.querySelector("input[type=text]")
    );
      await fireEvent.input(input, { target: { value: "This is a test word" } })
    expect(input.value).toBe('This is a test word');
  });

  test('It is not disable on render', async () => {
    const { container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
    });

    const input = <HTMLInputElement>(
      container.querySelector("input[type=text]")
    );
    expect(input).not.toBeDisabled();
  });

})
describe('button', () => {
  test('It renders', () => {

    const { container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
      
    });
    const button = container.querySelector('button[type=submit]')
    expect(button).toBeInTheDocument()
  });

  test('It is not disabled on render', () => {

    const { container } = render(MetricColumnWrapper, {
      props: {
        title: "metricValue",
        inputValue: 0,
        disabledButtonIfBothFromAPI: false,
        searxhString: "",
      },
      
    });
    const button = container.querySelector('button[type=submit]')
    expect(button).not.toBeDisabled()
  });

  // need to test the on click for the button
})