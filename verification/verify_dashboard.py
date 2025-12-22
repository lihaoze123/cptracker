from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000")

            # It might be in loading state first
            print("Waiting for something...")
            page.wait_for_timeout(5000)

            # Check if we see "Loading..."
            if page.locator("text=Loading...").is_visible():
                print("Still loading...")
                page.wait_for_selector("text=Dashboard", timeout=60000)

            print("Waiting additional time for animations...")
            page.wait_for_timeout(3000)

            page.screenshot(path="verification/dashboard_redesign.png", full_page=True)
            print("Screenshot taken at verification/dashboard_redesign.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/debug_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()
