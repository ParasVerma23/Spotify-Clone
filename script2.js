console.log("Let's do some fun!");

let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`http://127.0.0.1:5500/${currFolder}/`);
        let htmlContent = await response.text();

        let tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;

        let anchors = tempDiv.getElementsByTagName("a");
        songs = Array.from(anchors)
            .filter(anchor => anchor.href.endsWith(".mp3"))
            .map(anchor => anchor.href.split(`/${currFolder}/`)[1]);

        // Debug log
        console.log("Songs fetched:", songs);

        let songUL = document.querySelector(".songList ul");
        if (!songUL) {
            console.error("Playlist container not found!");
            return;
        }

        songUL.innerHTML = songs.map(song => `
            <li>
                <img class="invert" width="34" src="./music.svg" alt="">
                <div class="info">
                    <div>${decodeURIComponent(song.replaceAll("%20", " "))}</div>
                    <div>Artist Name</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="./play.svg" alt="">
                </div>
            </li>
        `).join("");

        Array.from(songUL.getElementsByTagName("li")).forEach((item, index) => {
            item.addEventListener("click", () => playMusic(songs[index]));
        });

    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "./pause.svg";
    }
    document.querySelector(".songinfo").textContent = decodeURIComponent(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";
};

async function displayAlbums() {
    try {
        let response = await fetch(`/folder/`);
        let htmlContent = await response.text();

        let tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;

        let anchors = tempDiv.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardContainer");

        Array.from(anchors).forEach(async anchor => {
            if (anchor.href.includes("/songs") && !anchor.href.includes(".htaccess")) {
                let folder = anchor.href.split("/").slice(-2)[0];

                try {
                    let folderResponse = await fetch(`/folder/${folder}/info.json`);
                    let folderInfo = await folderResponse.json();

                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                                </svg>
                            </div>
                            <img src="/songs/${folder}/cover.jpg" alt="">
                            <h2>${folderInfo.title}</h2>
                            <p>${folderInfo.description}</p>
                        </div>
                    `;

                } catch (err) {
                    console.error(`Error fetching folder info for ${folder}:`, err);
                }
            }
        });

        Array.from(document.getElementsByClassName("card")).forEach(card => {
            card.addEventListener("click", async () => {
                await getSongs(`folder/${card.dataset.folder}`);
                playMusic(songs[0]);
            });
        });

    } catch (error) {
        console.error("Error fetching albums:", error);
    }
}

async function main() {
    await getSongs("folder/ncs");
    playMusic(songs[0], true);
    await displayAlbums();

    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "/pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").textContent = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index < songs.length - 1) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = e.target.value / 100;
        document.querySelector(".volume img").src = currentSong.volume > 0 ? "./volume.svg" : "./mute.svg";
    });

    document.querySelector(".volume img").addEventListener("click", () => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            document.querySelector(".volume img").src = "./mute.svg";
        } else {
            currentSong.volume = 0.1;
            document.querySelector(".volume img").src = "./volume.svg";
        }
        document.querySelector(".range input").value = currentSong.volume * 100;
    });
}

main();
