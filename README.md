Based on https://github.com/nayumiDEV/jewcob-fakku-downloader

## How to use

1. Download or clone this repository
2. Download and install [Node.js](https://nodejs.org/)  version >= 22
3. Open this repository folder in command line
4. Install dependencies <code>npm i</code> or even better <code>yarn</code>
5. Open your normal web browser and install an extension that lets you export your cookies
6. In that web browser, sign in to FAKKU, and then export the cookies for FAKKU to a file
7. Copy that cookies file into the repository folder and name the file **cookies.txt**
8. Create **urls.txt** file in root folder and write into that urls of manga one by line
9. Open root folder in command line and run the command <code>node index.js -c cookies.txt -U urls.txt</code>
10. It will take like 5-10 seconds to show any output and then it will start downloading the manga to folders in the repository folder