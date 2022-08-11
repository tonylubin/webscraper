const puppeteer = require("puppeteer");

const productSearched = async (searchItem) => {

  const url = "https://www.boots.com";
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(50000);
  page.setDefaultNavigationTimeout(50000);
  await page.goto(url);
 
  await page.waitForSelector("#onetrust-accept-btn-handler");
  await page.click("#onetrust-accept-btn-handler");
 
  await page.waitForSelector("#AlgoliaSearchInput");
  await page.type("#AlgoliaSearchInput", searchItem);
  await Promise.all([page.waitForNavigation({waitUntil: "domcontentloaded"}), page.keyboard.press("Enter")]);

  // A condition check - as sometimes page doesn't go to display search result page
  let currentUrl = page.url().toLowerCase();
  
  // grab 1st word in searched for product e.g. ["Kiehl's", "Facial", "Fuel", "Energizing" "Face", "Wash", "250ml"]
  let searchTermArr = searchItem.split(" "); 
  let textCondition = searchTermArr[0].toLowerCase().replace(/\W/g, "");
  // example results page URL: "https://www.boots.com/sitesearch?searchTerm=Kiehls%20Facial%20Fuel%20Energizing%20Face%20Wash%20250ml"
  // check condition includes string:  e.g. "searchterm=kiehls" 
  // (N.B: in lowercase due to website using either upper/lower & removing punctuation)
  if(!currentUrl.includes(`searchterm=${textCondition}`)) {
    await page.type("#AlgoliaSearchInput", searchItem);
    await Promise.all([page.waitForNavigation({waitUntil: "domcontentloaded"}), page.keyboard.press("Enter")]);
  }
  
  const domId = ".estore_product_container";
  await page.waitForSelector(domId);

  let result = await page.evaluate(
    (id, searchTerm) => {

      // Array of items searched due to similarity (title website search)  
      const itemDomIdArr = Array.from(document.querySelectorAll(id));

      // Find exact product match (string)
      const itemDomElement = itemDomIdArr.find((item) => {
        return (
          item.querySelector(".product_name").innerText.toLowerCase() ===
          searchTerm.toLowerCase()
        );
      });

      // get dom selector name/id for exact product (if returns similar product search results)
      const findItemDomElementId =
        itemDomIdArr.length > 1
          ? `[data-productid="${itemDomElement.dataset.productid}"]`
          : `.${itemDomElement.className}`;

      // shortened dom id
      const partDomId = `${findItemDomElementId} > .product_info-container > .product_info`;

      // product details Object
      const product = {
        imageUrl: document
          .querySelector(
            `${findItemDomElementId} > .product_image > .image > .product_img_link > .product_img`
          )
          .getAttribute("src"),
        name: document.querySelector(
          `${findItemDomElementId} > .product_top_section > .product_name`
        ).innerText,
        currentPrice: document.querySelector(`${partDomId} > .product_price`)
          .innerText,
        previousPrice: document.querySelector(
          `${partDomId} > .product_savePrice`
        ).innerText,
        offer: document.querySelector(
          `${findItemDomElementId} > .product_offer`
        ).innerText,
        stockStatus: document.querySelector(
          `${findItemDomElementId} > .product_info-container > .product_add`
        ).innerText,
      };
      return product;
    },
    domId,        // arguments to parameters
    searchItem   //  (id, searchTerm)
  );

  browser.close();
  return result;
};

module.exports = productSearched;
