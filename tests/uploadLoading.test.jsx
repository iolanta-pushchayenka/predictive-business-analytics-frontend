// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { UploadContext } from "../src/context/UploadContext.js";
import UploadPage from "../src/pages/UploadPage.jsx";

afterEach(cleanup);

it("shows parsing progress and disables Continue until full CSV processing ends", () => {
    const handleContinueFromUpload = vi.fn();
    const upload = {
        currentStep: 1,
        file: new File(["amount\n10"], "sales.csv"),
        columns: ["amount"],
        handleContinueFromUpload
    };

    function page(processing) {
        return (
            <MemoryRouter>
                <UploadContext.Provider value={{ ...upload, processing }}>
                    <UploadPage />
                </UploadContext.Provider>
            </MemoryRouter>
        );
    }

    const { rerender } = render(page(false));
    const continueButton = () => screen.getByRole("button", { name: "Continue to column mapping" });

    expect(continueButton().disabled).toBe(false);
    fireEvent.click(continueButton());
    expect(handleContinueFromUpload).toHaveBeenCalledTimes(1);

    rerender(page(true));
    const processingButton = screen.getByRole("button", { name: "Processing..." });
    expect(processingButton.disabled).toBe(true);
    expect(processingButton.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(processingButton);
    expect(handleContinueFromUpload).toHaveBeenCalledTimes(1);

    rerender(page(false));
    expect(continueButton().disabled).toBe(false);
});
