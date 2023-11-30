const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const ShoppingItem = require('../models/product');

puppeteer.use(StealthPlugin());

const productSearched = async (searchItem) => {

  const url = "https://www.sainsburys.co.uk/shop/gb/groceries";

   // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.setDefaultTimeout(50000);
  page.setDefaultNavigationTimeout(50000);
  await page.goto(url);
  
  // handle cookies modal
  const cookiesBtn = await page.waitForSelector(
    "button::-p-text(Accept All Cookies)"
  );
  await cookiesBtn.click();

  // Enter product into search bar
  const searchBar = await page.waitForSelector("#search");
  await searchBar.type(searchItem);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.keyboard.press("Enter"),
  ]);

  // Click to product page
  const productLink = await page.waitForSelector(".pt__link");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    productLink.click(),
  ]);

  // wait for image uploaded on page
  await page.waitForSelector(".pd__image");

  // Getting Info from searched product
  // Using try/catch if dom element not available - handles thrown error 
  const getProductInfo = async (selector, domProperty) => {
    let productInfo;
    try {
      productInfo = await page.$eval(
        selector,
        (el, domAttribute) => {
          return el[domAttribute];
        },
        domProperty // argument to params of eval function
      );
    } catch (error) {
      console.log(error);
      productInfo = "";
    }
    return productInfo;
  };

  // selectors for dom elements
  const domRefs = {
    title: "[role='main'] .pd__header",
    offerPrice: "[role='main'] .pd__cost--price",
    retailPrice: "[role='main'] .pd__cost__retail-price",
    imageSrc: "[role='main'] .pd__image",
    promotionMsg: "[role='main'] .promotion-message",
    nectarOffer: "[role='main'] .promotional-tag--nectar",
    offer: "[role='main'] .promotional-tag"
  }

  let Product = new ShoppingItem({
    title: await getProductInfo(domRefs.title, "innerText"),
    retailPrice: await getProductInfo(domRefs.retailPrice, "innerText"),
    offerPrice: await getProductInfo(domRefs.offerPrice, "innerText"),
    imageUrl: await getProductInfo(domRefs.imageSrc, "src"),
    promotionMsg: await getProductInfo(domRefs.promotionMsg, "innerText"),
    nectarOffer: await getProductInfo(domRefs.nectarOffer, "innerText"),
    offer: await getProductInfo(domRefs.offer, "innerText")
  });

  browser.close();
  return { Product };
};

module.exports = productSearched;