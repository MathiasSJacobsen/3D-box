import type { Searchdims } from "../types/SearchDim";
import type { UnsplashSearchResponseType } from "../types/UnsplashTypes";

export const fetchPicture = async (searchWord: string): Promise<UnsplashSearchResponseType> | undefined => {
    const per_page = 1;
    const page = 1;
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      `Client-ID ${process.env.UNSPLASH_API_KEY}`
    );

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
    };

    console.log("Sending request");

    const response = await fetch(
      `https://api.unsplash.com/search/photos?page=${page}&query=${searchWord}&per_page=${per_page}`,
      requestOptions
    );
    const JSONresponse: UnsplashSearchResponseType = await response.json();

    if (JSONresponse.results.length === 0) {
      console.log("No picture fund!");
      return;
    }
    return JSONresponse
}
