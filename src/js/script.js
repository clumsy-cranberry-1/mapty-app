"use strict";

const form = document.querySelector("form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelectorAll(".form__input--duration");
const inputElevation = document.querySelector(".form__input--elevation");

// #######################################################################################
class App {
	allWorkouts = [];
	workout;
	map;
	mapEvent;
	mapMarker;
	mapPopup;

	constructor() {
		// USER SUBMITS NEW WORKOUT
		form.addEventListener("submit", this._newWorkout.bind(this));
		this._getUserPosition();
		// USER CLICKS ON WORKOUT IN LIST
		containerWorkouts.addEventListener("click", this._moveToMarker.bind(this));
	}

	// =====================================================================================
	// GET USER'S CURRENT LOCATION COORDINATES
	_getUserPosition() {
		// use geolocation api
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this._renderMap.bind(this), function (error) {
				alert(error.message);
			});
		}
	}

	// =====================================================================================
	// RENDER MAP ON CURRENT LOCATION
	_renderMap(position) {
		const { latitude, longitude } = position.coords;
		// create map
		this.map = L.map("map").setView([latitude, longitude], 15);

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);

		// USER CLICKS ON MAP
		this.map.on("click", this._showForm.bind(this));
	}

	// =====================================================================================
	// RENDER WORKOUT FORM
	_showForm(e) {
		this.mapEvent = e;
		// get click coords
		const { lat, lng } = this.mapEvent.latlng;

		// add a marker at the click coords
		const customMarker = L.icon({
			iconUrl: "../src/img/marker-icon.png",
			iconSize: [25, 41],
			iconAnchor: [12, 41],
			popupAnchor: [1, -34],
			shadowUrl: "../src/img/marker-shadow.png",
			shadowSize: [41, 41]
		});
		this.mapMarker = L.marker([lat, lng], { icon: customMarker }).addTo(this.map);

		// display form
		form.classList.remove("hidden");

		// set focus on form input element
		inputDistance.focus();
	}

	// =====================================================================================
	_hideForm() {
		inputDistance.value = "";
		inputElevation.value = "";
		form.classList.add("hidden");
	}

	// =====================================================================================
	// RENDER WORKOUT IN SIDEBAR LIST
	_renderWorkout() {
		const html = ` 
      	<li class="workout workout--${this.workout.type}" data-id="${this.workout.id}">
			<div class="workout__heading">
				${this.workout.type === "running" ? `<i class="fa-solid fa-person-running workout__icon"></i>` : `<i class="fa-solid fa-bicycle"></i>`}
				<p class="workout__date">${this.workout.workoutDate}</p>
			</div>
			<div class="workout__details">
				<div>
					<span class="workout__label">Distance</span>
					<span>
					<span class="workout__value">${this.workout.distance}</span>
					<span class="workout__unit">km</span>
					</span>
				</div>
				<div>
					<span class="workout__label">Duration</span>
					<span>
					<span class="workout__value">${this.workout.duration}</span>
					<span class="workout__unit">min</span>
					</span>
				</div>
				<div>
					<span class="workout__label">Avg Pace</span>
					<span>
					<span class="workout__value">${this.workout.pace}</span>
					<span class="workout__unit">min/km</span>
					</span>
				</div>
				<div>
					<span class="workout__label">Elevation</span>
					<span>
					<span class="workout__value">${this.workout.elevation}</span>
					<span class="workout__unit">spm</span>
					</span>
				</div>
			</div>
        </li>`;

		form.insertAdjacentHTML("afterend", html);
	}

	// =====================================================================================
	// RENDER WORKOUT ON MAP
	_renderPopup() {
		this.mapPopup = L.popup({
			maxWidth: 300,
			maxHeight: 75,
			closeButton: false,
			autoClose: false,
			closeOnClick: false,
			className: `${this.workout.type}--popup`
		});

		const popupHtml = `
        <span>Distance:</span>
        <span>${this.workout.distance} km</span>
        <span>Duration:</span>
        <span>${this.workout.duration}</span>
        <span>Avg. Pace:</span>
        <span>${this.workout.pace} min/km</span>
      `;

		this.mapMarker.bindPopup(this.mapPopup).setPopupContent(`${popupHtml}`).openPopup();
	}

	// =====================================================================================
	_newWorkout(e) {
		e.preventDefault();

		// 1. get data from the form inputs
		const type = inputType.value;
		const distance = Number(inputDistance.value);
		const elevation = Number(inputElevation.value);
		const { lat, lng } = this.mapEvent.latlng; // refer to _showForm()

		// 2. validate input values
		// #  check that values are numbers
		const allNumberInput = function (...inputs) {
			return inputs.every(function (input) {
				return isFinite(input);
			});
		};
		// #  check for empty values
		const allRequiredInput = function (...inputs) {
			return inputs.some(function (input) {
				return input !== 0;
			});
		};
		// # implement data validation checks
		const inputs = [distance, elevation];
		if (!allNumberInput(...inputs)) {
			return alert("All fields are required. \nTip: Input value must be numeric and greater than 0");
		}
		if (!allRequiredInput(...inputs)) {
			return alert("All fields are required. \nTip: Input value must be numeric and greater than 0");
		}

		// 3. Add workout to this.allWorkouts array;
		this.workout = new Workout([lat, lng], distance, elevation, type);
		this.allWorkouts.push(this.workout);

		// 4. hide form and clear form input fields
		this._hideForm();

		// 5. render workouts in sidebar & marker popup
		this._renderWorkout();
		this._renderPopup();
	}

	// =====================================================================================
	// USER CLICKS ON WORKOUT IN SIDEBAR: MOVE TO IT'S MARKER ON THE MAP
	_moveToMarker(e) {
		const workoutElement = e.target.closest(".workout");

		if (workoutElement) {
			const workoutElementCoords = this.allWorkouts.find((workout) => {
				return workout.id === workoutElement.dataset.id;
			}).coords;

			this.map.setView(workoutElementCoords, 15, {
				animate: true,
				pan: {
					duration: 1.5
				}
			});
		}
	}
}

const app = new App();

// #######################################################################################
// #######################################################################################
class Workout {
	id;
	workoutDate = new Date();
	workoutTitle;

	constructor(coords, distance, elevation, type) {
		this.coords = coords; // [lat, lng]
		this.distance = distance; // km
		this.elevation = elevation;
		this.type = type;

		this.id = this._generateQuickGuid();
		this._setWorkoutDuration();
		this._setWorkoutPace();
		this._setWorkoutTitle();
		this._setWorkoutDate();
	}

	// =====================================================================================
	_setWorkoutDuration() {
		const [hours, minutes, seconds] = inputDuration;
		this.duration = `${hours.value}:${minutes.value}:${seconds.value}`;
	}

	// =====================================================================================
	_setWorkoutPace() {
		const distance = this.distance;
		const [hours, minutes, seconds] = inputDuration;
		const _calcSeconds = function () {
			const h = Number(hours.value);
			const m = Number(minutes.value);
			const s = Number(seconds.value);
			return h * 60 * 60 + m * 60 + s;
		};
		const _getPaceMinutes = function () {
			const seconds = _calcSeconds();
			const minutes = seconds / 60;
			const minPerKm = Math.floor(minutes / distance);
			return minPerKm;
		};
		const _getPaceSeconds = function () {
			const seconds = _calcSeconds();
			const secPerKm = Math.floor((seconds / 60 / distance - _getPaceMinutes()) * 100);
			return secPerKm;
		};

		this.pace = `${_getPaceMinutes()}:${_getPaceSeconds()}`;
	}

	// =====================================================================================
	_generateQuickGuid() {
		return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	}

	// =====================================================================================
	_setWorkoutTitle() {
		this.workoutTitle = `${this.type[0].toUpperCase() + this.type.slice(1).toLowerCase()}`;
	}

	// =====================================================================================
	_setWorkoutDate() {
		const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

		this.workoutDate = `${this.workoutDate.getDay()} ${months[this.workoutDate.getMonth()]}`;
	}
}

// #######################################################################################
// TO-DO
// #######################################################################################
/* # Add feature to show All, only Cycling or only Running exercises in the sidebar
 ** # Delete selected workout and corresponding markers/popups
 */
