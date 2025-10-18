Based on https://github.com/nayumiDEV/jewcob-fakku-downloader

## Install

1. Download or clone this repository
2. Download and install [Node.js](https://nodejs.org/)  version >= 22
3. Open this repository folder in command line
4. Install dependencies <code>npm i</code> or even better <code>yarn</code>

## Use

1. Open your normal web browser and install an extension that lets you export your cookies
2. In that web browser, sign in to FAKKU, and then export the cookies for FAKKU to a file
3. Copy that cookies file into the repository folder and name the file **cookies.txt**
4. Create **urls.txt** file in root folder and write into that urls of manga one by line
5. Open repository folder in command line and run the command <code>node main.js -c cookies.txt -U urls.txt</code>
6. It will take like 5-10 seconds to show any output and then it will start downloading the manga to folders in the repository folder

If you get an error part way through downloading multiple manga, then you can simply start the program again.
It will skip manga that have already been fully downloaded.

The program keeps track of which manga have already been downloaded by logging downloaded manga urls to a file downloads.log.
Once your downloads are all completed, you may want to delete the downloads.log file, otherwise it will just get larger and larger.
