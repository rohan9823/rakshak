const functions = require('firebase-functions');
const express = require('express');
const app = express();
const hosp = express();
const gre = express();
const path = require('path');
const session = require('express-session');
const FirebaseStore = require('connect-session-firebase')(session);
var nodemailer = require('nodemailer');

exports.app = functions.https.onRequest(app);
exports.hosp = functions.https.onRequest(hosp);
exports.gre = functions.https.onRequest(gre);

var Busboy = require('busboy');
var os = require('os');
var fs = require('fs');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))

hosp.set('views', path.join(__dirname, 'views'));
hosp.set('view engine', 'ejs');
hosp.use(express.static(path.join(__dirname, 'public')))

gre.set('views', path.join(__dirname, 'views'));
gre.set('view engine', 'ejs');
gre.use(express.static(path.join(__dirname, 'public')))

var bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({
	extended: false
})

const admin = require('firebase-admin');

let serviceAccount = require('./covid-1.json');

let ref = admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://rakshak-200da-default-rtdb.firebaseio.com"
});
let db = admin.firestore();


// ================================================  app for admin ====================================================

app.use(session({
	store: new FirebaseStore({
		database: ref.database(),
	}),
	name: '__session',
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: false,
		maxAge: 24 * 60 * 60 * 1000
	}
}))

app.get('/', (req, res) => {
	if (req.session.email) {
		res.redirect('/logged/' + req.session.email);
	} else {
		let error = null
		res.render('login', {
			error: error
		});
	}

})

app.post('/login', urlencodedParser, (req, res) => {

	db.collection('admin').where('id', '==', req.body.email).get()
		.then(snapshot => {
			if (snapshot.empty) {
				let error = 'Please enter valid ID';
				res.render('login', {
					error: error
				});
				return;
			}

			snapshot.forEach(doc => {
				if (doc.data().password == req.body.password) {
					req.session.email = req.body.email;
					res.redirect('/logged/' + req.session.email);
				} else {
					let error = 'Please enter valid password';
					res.render('login', {
						error: error
					});
				}
			});
		})
		.catch(err => {
			console.log('Error getting documents', err);
			res.render('login', {
				error: "Some error occured during logging in"
			});
		});
})

app.get('/logged/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		res.render('logged', {
			id: req.params.id
		});
	} else {
		res.redirect('/');
	}
})

app.post('/add', urlencodedParser, (req, res) => {

	if (req.session.email) {
		var data = {
			name: req.body.name,
			beds: req.body.beds,
			area: req.body.area.toLowerCase(),
			district: req.body.district.toLowerCase(),
			state: req.body.state.toLowerCase(),

			mname: req.body.mname,
			mbeds: req.body.mbeds,
			marea: req.body.marea,
			mdistrict: req.body.mdistrict,
			mstate: req.body.mstate,
		}
		db.collection('hospitals').doc().set(data).then(() => {
			res.redirect('/logged/' + req.body.id);
		})
	} else {
		res.redirect('/');
	}
})

app.get('/social_post/:id', (req, res) => {
	if (req.session.email == req.params.id) {
		res.render('social_post', {
			id: req.params.id,
		});
	} else {
		res.redirect('/');
	}
})

app.post('/upload', (req, res) => {

	if (req.session.email) {
		let formdata = new Map();
		let base64string;
		var busboy = new Busboy({
			headers: req.headers
		});

		busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

			file.on('data', function (data) {
				let binarydata = data;
				base64string = new Buffer(binarydata).toString("base64");
			});

			var saveTo = path.join(os.tmpDir(), path.basename(fieldname));
			file.pipe(fs.createWriteStream(saveTo));
		});

		busboy.on('field', function (fieldname, val) {
			formdata.set(fieldname, val);
		})

		busboy.on('finish', function () {
			db.collection('media').doc().set({
				link: formdata.get('link'),
				description: formdata.get('msg'),
				title: formdata.get('title'),
				image: [base64string]
			})
				.then(() => {
					res.redirect('/social_post/' + formdata.get('id'));
				})
				.catch(() => {
					res.render('social_post', {
						id: formdata.get('id')
					})
				})
		});
		busboy.end(req.rawBody);
		return req.pipe(busboy);
	} else {
		res.redirect('/');
	}
})

app.get('/webapp/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		res.render('webapp', {
			id: req.params.id
		});
	} else {
		res.redirect('/');
	}
})

app.post('/webapp', (req, res) => {

	if (req.session.email) {
		// console.log(req.body.id);
		// if (req.session.email == req.body.id) {
		let formdata = new Map();
		let base64string;
		var busboy = new Busboy({
			headers: req.headers
		});

		busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

			file.on('data', function (data) {
				let binarydata = data;
				base64string = new Buffer(binarydata).toString("base64");
			});

			var saveTo = path.join(os.tmpDir(), path.basename(fieldname));
			file.pipe(fs.createWriteStream(saveTo));
		});

		busboy.on('field', function (fieldname, val) {
			formdata.set(fieldname, val);
		})

		busboy.on('finish', function () {
			db.collection('webviews').doc().set({
				image: [base64string],
				link: formdata.get('webapplink'),
				name: formdata.get('webappname'),
			})
				.then(() => {
					res.redirect('/webapp/' + formdata.get('id'));
				})

		});

		busboy.end(req.rawBody);
		return req.pipe(busboy);
		// } else {
		// 	res.redirect('/');
		// }
	} else {
		res.redirect('/');
	}

})

app.post('/logout', (req, res) => {
	if (req.session.email)
		req.session.destroy()
	res.redirect('/')
})

app.get('/delete/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		var data = {}
		db.collection('hospitals').get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					return;
				}
				snapshot.forEach(doc => {
					data[doc.id] = {
						id: doc.id,
						name: doc.data().name,
						beds: doc.data().beds,
						area: doc.data().area,
						district: doc.data().district,
						state: doc.data().state
					}
				});
				res.render('delete', {
					id: req.params.id,
					data: data
				});
			})
			.catch(err => {
				console.log('Error getting documents', err);
			});
	} else {
		res.redirect('/');
	}

})

app.post('/delete_hospital', urlencodedParser, function (req, res) {

	db.collection('hospitals').doc(req.body.host).delete()
		.then(() => {
			res.redirect('/delete/' + req.body.id)
		})
})

app.get('/assesment/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		var userdata = {};
		var userdata2 = {}
		db.collection('users').get()
		db.collection('users').get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.1');
					return;
				}
				let len = 0;
				snapshot.forEach(doc => {

					db.collection('users').doc(doc.id).collection('testdata').get()
						.then(subsnapshot => {
							len += 1;
							sublen = 0;
							console.log("this is len", len);
							if (subsnapshot.empty) {
								console.log('No matching documents.2');

							} else {

								subsnapshot.forEach(subdoc => {

									sublen += 1;

									if (subdoc.data().flag)
										userdata[subdoc.id] = {
											name: doc.data().name,
											age: subdoc.data().data.age,
											risk: subdoc.data().data.risk,
											progress: subdoc.data().data.progress,
											chills: subdoc.data().data.chills,
											collapse: subdoc.data().data.collapse,
											cough: subdoc.data().data.cough,
											diabetes: subdoc.data().data.diabetes,
											heartdisease: subdoc.data().data.heartdisease,
											highbp: subdoc.data().data.highbp,
											kidneydisease: subdoc.data().data.kidneydisease,
											lostest: subdoc.data().data.lostest,
											lungdisease: subdoc.data().data.lungdisease,
											muscleAche: subdoc.data().data.musleAche,
											nausea: subdoc.data().data.nausea,
											temperature: subdoc.data().data.tempreature,
											troubleBreath: subdoc.data().data.trubleBreath,
											Is_Quarantine: subdoc.data().data.isQuarantine,
											Quarantine_Location: subdoc.data().data.quarantineLocation,
										}
									else {
										userdata2[subdoc.id] = {
											name: doc.data().name,
											age: subdoc.data().data.age,
											risk: subdoc.data().data.risk,
											progress: subdoc.data().data.progress,
											chills: subdoc.data().data.chills,
											collapse: subdoc.data().data.collapse,
											cough: subdoc.data().data.cough,
											diabetes: subdoc.data().data.diabetes,
											heartdisease: subdoc.data().data.heartdisease,
											highbp: subdoc.data().data.highbp,
											kidneydisease: subdoc.data().data.kidneydisease,
											lostest: subdoc.data().data.lostest,
											lungdisease: subdoc.data().data.lungdisease,
											muscleAche: subdoc.data().data.musleAche,
											nausea: subdoc.data().data.nausea,
											temperature: subdoc.data().data.tempreature,
											troubleBreath: subdoc.data().data.trubleBreath,
											Is_Quarantine: subdoc.data().data.isQuarantine,
											Quarantine_Location: subdoc.data().data.quarantineLocation,

										}
									}
									console.log("len is:", len)
									console.log("sublen is:", sublen)
									if (len == snapshot.size && sublen == subsnapshot.size) {
										// console.log(userdata)
										// 			console.log("string")
										// 			res.render('assesment', {
										// 	id: req.params.id,
										// 	userdata: userdata,
										// 	userdata2: userdata2
										// })
									}
								})
							}

							if (len == snapshot.size && sublen == subsnapshot.size) {
								// console.log(userdata)
								console.log("string")
								res.render('assesment', {
									id: req.params.id,
									userdata: userdata,
									userdata2: userdata2
								})
							}
						})

				})
			})
	} else {
		res.redirect('/');
	}
})



// app.get('/assesment/:id', (req, res) =>{

// 	if (req.session.email == req.params.id) {
// 	userdata = [];
// 	userdata2 = [];

// 	db.collection('users').get()
// 		.then(snapshot => {
// 				if (snapshot.empty) {
// 					console.log('No matching documents.1');
// 					return;
// 				}
// 				let len = 0;
// 				snapshot.forEach(doc => {	

// 					db.collection('users').doc(doc.id).collection('testdata').get()
// 				.then( subsnapshot => {
// 					len += 1;
// 					sublen = 0;
// 					console.log("this is len",len);
// 				if (subsnapshot.empty) {
// 					console.log('No matching documents.2');

// 				}else{

// 					subsnapshot.forEach(subdoc => {

// 						sublen += 1;

// 						if (subdoc.data().flag)
// 						userdata[subdoc.id] = {
// 							name: doc.data().name,							
// 							age: subdoc.data().age,
// 							risk: subdoc.data().risk,
// 							progress: subdoc.data().progress,
// 							chills: subdoc.data().chills,
// 							collapse: subdoc.data().collapse,
// 							cough: subdoc.data().cough,
// 							diabetes: subdoc.data().diabetes,
// 							heartdisease: subdoc.data().heartdisease,
// 							highbp: subdoc.data().highbp,
// 							kidneydisease: subdoc.data().kidneydisease,
// 							lostest: subdoc.data().lostest,
// 							lungdisease: subdoc.data().lungdisease,
// 							muscleAche: subdoc.data().musleAche,
// 							nausea: subdoc.data().nausea,
// 							temperature: subdoc.data().tempreature,
// 							troubleBreath: subdoc.data().trubleBreath,
// 							Is_Quarantine: subdoc.data().isQuarantine,
// 							Quarantine_Location: subdoc.data().quarantineLocation,
// 						}
// 						else{
// 							userdata2[subdoc.id] ={
// 							name: doc.data().name,							
// 							age: subdoc.data().age,
// 							risk: subdoc.data().risk,
// 							progress: subdoc.data().progress,
// 							chills: subdoc.data().chills,
// 							collapse: subdoc.data().collapse,
// 							cough: subdoc.data().cough,
// 							diabetes: subdoc.data().diabetes,
// 							heartdisease: subdoc.data().heartdisease,
// 							highbp: subdoc.data().highbp,
// 							kidneydisease: subdoc.data().kidneydisease,
// 							lostest: subdoc.data().lostest,
// 							lungdisease: subdoc.data().lungdisease,
// 							muscleAche: subdoc.data().musleAche,
// 							nausea: subdoc.data().nausea,
// 							temperature: subdoc.data().tempreature,
// 							troubleBreath: subdoc.data().trubleBreath,
// 							Is_Quarantine: subdoc.data().isQuarantine,
// 							Quarantine_Location: subdoc.data().quarantineLocation,

// 							}
// 						}
// 						console.log("len is:" ,len)
// 						console.log("sublen is:" ,sublen)
// 						if (len == snapshot.size && sublen == subsnapshot.size)
// 						{
// 							// console.log(userdata)
// 							console.log("string")
// 							res.render('assesment', {
// 					id: req.params.id,
// 					userdata: userdata,
// 					userdata2: userdata2
// 				})
// 						}
// 					})
// 				}

// 					if (len == snapshot.size && sublen == subsnapshot.size)
// 						{
// 							// console.log(userdata)
// 							console.log("string")
// 							res.render('assesment', {
// 					id: req.params.id,
// 					userdata: userdata,
// 					userdata2: userdata2
// 				})
// 						}
// 			})

// 		})
// 	})

// } else {
// 	res.redirect('/');
// 	}
// })


// db.collection('users').get()
// 		.then(snapshot => {
// 				if (snapshot.empty) {
// 					console.log('No matching documents.1');
// 					return;
// 				}
// 				snapshot.forEach(doc => {

// 					db.collection('users').doc(doc.id).collection('testdata').get()
// 				.then(async subsnapshot => {

// 				if (subsnapshot.empty) {
// 					console.log('No matching documents.2');
// 					return;
// 				}
// 				return new Promise((resolve, reject) => {
// 					subsnapshot.forEach(subdoc => {

// 						userdata[subdoc.id] = {
// 							name: doc.data().name,							
// 							age: subdoc.data().data.age,
// 							risk: subdoc.data().data.risk,
// 							progress: subdoc.data().data.progress,
// 							chills: subdoc.data().data.chills,
// 							collapse: subdoc.data().data.collapse,
// 							cough: subdoc.data().data.cough,
// 							diabetes: subdoc.data().data.diabetes,
// 							heartdisease: subdoc.data().data.heartdisease,
// 							highbp: subdoc.data().data.highbp,
// 							kidneydisease: subdoc.data().data.kidneydisease,
// 							lostest: subdoc.data().data.lostest,
// 							lungdisease: subdoc.data().data.lungdisease,
// 							muscleAche: subdoc.data().data.musleAche,
// 							nausea: subdoc.data().data.nausea,
// 							temperature: subdoc.data().data.tempreature,
// 							troubleBreath: subdoc.data().data.trubleBreath,
// 							Is_Quarantine: subdoc.data().data.isQuarantine,
// 							quarantineLocation: subdoc.data().data.quarantineLocation,
// 						}
// 						console.log("1")	
// 					})
// 					resolve(userdata);
// 				}) 
// 				.then((user) => {
// 					efl(user);
// 				})

// 			})


// 		})

// 	})


app.get('/delete_social/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		var data = {}
		db.collection('media').get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					return;
				}
				snapshot.forEach(doc => {
					data[doc.id] = {
						id: doc.id,
						title: doc.data().title,
						// beds: doc.data().link,
						description: doc.data().description,
					}
				});
				res.render('delete_social', {
					id: req.params.id,
					data: data
				});
			})
			.catch(err => {
				console.log('Error getting documents', err);
			});
	} else {
		res.redirect('/');
	}
})

app.get('/delete_webapp/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		var data = {}
		db.collection('webviews').get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					return;
				}
				snapshot.forEach(doc => {
					data[doc.id] = {
						id: doc.id,
						name: doc.data().name,
						// link: doc.data().link,
						// area: doc.data().description,
					}
				});
				res.render('delete_webapp', {
					id: req.params.id,
					data: data
				});
			})
			.catch(err => {
				console.log('Error getting documents', err);
			});
	} else {
		res.redirect('/');
	}
})

app.post('/delete_social', urlencodedParser, function (req, res) {

	db.collection('media').doc(req.body.host).delete()
		.then(() => {
			res.redirect('/delete_social/' + req.body.id)
		})
})

app.post('/delete_webapp', urlencodedParser, function (req, res) {

	db.collection('webviews').doc(req.body.host).delete()
		.then(() => {
			res.redirect('/delete_webapp/' + req.body.id)
		})
})

app.get('/hospitalRequest/:id', (req, res) => {

	if (req.session.email == req.params.id) {
		var data = {}
		db.collection('hospitalRequest').get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					res.render('hospitalRequest', {
						id: req.params.id,
						data: null
					});
					return;
				}
				snapshot.forEach(doc => {
					data[doc.id] = {
						id: doc.id,
						name: doc.data().name,
						beds: doc.data().beds,
						area: doc.data().area,
						type: doc.data().type
					}
				});
				res.render('hospitalRequest', {
					id: req.params.id,
					data: data
				});
			})
			.catch(err => {
				console.log('Error getting documents', err);
			});
	} else {
		res.redirect('/');
	}
})

app.post('/hospitalRequest', urlencodedParser, (req, res) => {

	if (req.body.choice == "accept") {
		db.collection('hospitalRequest').doc(req.body.host).get()
			.then((doc) => {
				if (doc.exists) {
					db.collection('hospitals').doc().set(doc.data()).then(() => {

						db.collection('hospitalRequest').doc(req.body.host).delete()
							.then(() => {
								res.redirect('/hospitalRequest/' + req.body.id)
							})

					})
				}
			})
	} else {
		db.collection('hospitalRequest').doc(req.body.host).delete()
			.then(() => {
				res.redirect('/hospitalRequest/' + req.body.id)
			})
	}

})

app.get('/addlab/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		res.render('addlab', {
			id: req.params.id
		});
	} else {
		res.redirect('/');
	}
})

app.post('/addlab', urlencodedParser, (req, res) => {

	if (req.session.email) {
		var info = {
			name: req.body.testlabname,
			maddress: req.body.maddress,
			mname: req.body.mtestlabname,
			address: req.body.address,
			mtype: req.body.mtype,
			type: req.body.type,
			phone: req.body.contact,
		}
		db.collection('testlabs').doc().set(info).then(() => {
			res.redirect('/addlab/' + req.body.id);
		})
	} else {
		res.redirect('/');
	}

})

app.get('/delete_addlab/:id', function (req, res) {

	if (req.session.email == req.params.id) {
		var data = {}
		db.collection('testlabs').get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					return;
				}
				snapshot.forEach(doc => {
					data[doc.id] = {
						id: doc.id,
						name: doc.data().name,
						address: doc.data().address,
						type: doc.data().type,
						phone: doc.data().phone,
					}
				});
				res.render('delete_addlab', {
					id: req.params.id,
					data: data
				});
			})
			.catch(err => {
				console.log('Error getting documents', err);
			});
	} else {
		res.redirect('/');
	}
})

app.post('/delete_addlab', urlencodedParser, function (req, res) {

	db.collection('testlabs').doc(req.body.host).delete()
		.then(() => {
			res.redirect('/delete_addlab/' + req.body.id)
		})
})



app.get('/get_grievance/:id', function (req, res) {
	if (req.session.email == req.params.id) {
		var data = {}
		db.collection('grievance').get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					return;
				}
				snapshot.forEach(doc => {
					data[doc.id] = {
						id: doc.id,
						name: doc.data().name,
						type: doc.data().type,
						mail: doc.data().mail,
						message: doc.data().message,
						// state: doc.data().state
					}
				});
				res.render('get_grievance', {
					id: req.params.id,
					data: data
				});
			})
			.catch(err => {
				console.log('Error getting documents', err);
			});
	} else {
		res.redirect('/');
	}

})


// =================================================================end of app fpr admin =======================================================


// ================================================================= hosp for hospital =========================================================== 


hosp.use(session({
	store: new FirebaseStore({
		database: ref.database(),
	}),
	name: '__session',
	secret: 'keyboard dog',
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: false,
		maxAge: 24 * 60 * 60 * 1000
	}
}))

hosp.get('/', (req, res) => {

	if (req.session.logid) {
		res.redirect('/hosp_dashboard');
	} else {
		let error = null
		res.render('Hospital_login', {
			error: error
		});
	}
})

hosp.get('/Hospital_login', (req, res) => {

	if (req.session.logid) {
		res.redirect('/hosp_dashboard');
	} else {
		let error = null
		res.render('Hospital_login', {
			error: error
		});
	}
})

hosp.post('/Hospital_login', urlencodedParser, (req, res) => {

	db.collection('hospitals').where('id', '==', req.body.id).get()
		.then(snapshot => {
			if (snapshot.empty) {
				let error = 'Please enter valid ID';
				res.render('Hospital_login', {
					error: error
				});
				return;
			}

			snapshot.forEach(doc => {
				if (doc.data().password == req.body.password) {
					req.session.logid = req.body.id;
					res.redirect('/hosp_dashboard');
				} else {
					let error = 'Please enter valid password';
					res.render('Hospital_login', {
						error: error
					});
				}
			});
		})
		.catch(err => {
			console.log('Error getting documents', err);
			res.render('Hospital_login', {
				error: "Some error occured during logging in"
			});
		});
})

hosp.post('/hosp_logout', (req, res) => {
	if (req.session.logid)
		req.session.destroy()
	res.redirect('/')
})

hosp.get('/register', (req, res) => {
	res.render('register', {
		error: null,
		data: null
	})
})

hosp.post('/register', urlencodedParser, (req, res) => {

	db.collection('hospitalRequest').where('id', '==', req.body.id).get()
		.then(snapshot => {
			if (snapshot.empty) {

				db.collection('hospitals').where('id', '==', req.body.id).get()
					.then(snapshot => {
						if (snapshot.empty) {

							var data = {
								name: req.body.name,
								mname: req.body.mname,
								beds: req.body.beds,
								address: req.body.area.toLowerCase(),
								maddress: req.body.marea.toLowerCase(),
								type: req.body.type,
								id: req.body.id,
								password: req.body.NPassword,

							}
							db.collection('hospitalRequest').doc().set(data).then((err) => {
								res.redirect('Hospital_login/');

							})
								.catch(err => {
									let error = "Some error occured, Please try again later";
									res.render('register', {
										error: error,
										data: {
											name: req.body.name,
											mname: req.body.mname,
											beds: req.body.beds,
											area: req.body.area,
											marea: req.body.marea
										}
									});
								})

							return;
						} else {
							let error = "ID is alredy exists";
							res.render('register', {
								error: error,
								data: {
									name: req.body.name,
									mname: req.body.mname,
									beds: req.body.beds,
									area: req.body.area,
									marea: req.body.marea
								}
							});
						}

					})
					.catch(err => {
						console.log("inside catch 2");
						var data = {
							name: req.body.name,
							mname: req.body.mname,
							beds: req.body.beds,
							address: req.body.area.toLowerCase(),
							maddress: req.body.marea.toLowerCase(),
							type: req.body.type,
							id: req.body.id,
							password: req.body.NPassword,
						}
						db.collection('hospitalRequest').doc().set(data).then(() => {
							let error = null
							res.redirect('Hospital_login' + error);
						})
							.catch(err => {
								let error = "Some error occured, Please try again later";
								res.render('register', {
									error: error,
									data: {
										name: req.body.name,
										mname: req.body.mname,
										beds: req.body.beds,
										area: req.body.area,
										marea: req.body.marea
									}
								});
							})

					})


				return;
			} else {
				let error = "ID is alredy exists";
				res.render('register', {
					error: error,
					data: {
						name: req.body.name,
						mname: req.body.mname,
						beds: req.body.beds,
						area: req.body.area,
						marea: req.body.marea
					}
				});
			}

		})
		.catch(err => {
			console.log("inside catch 2");
			var data = {
				name: req.body.name,
				mname: req.body.mname,
				beds: req.body.beds,
				address: req.body.area.toLowerCase(),
				maddress: req.body.marea.toLowerCase(),
				type: req.body.type,
				id: req.body.id,
				password: req.body.NPassword,
			}
			db.collection('hospitalRequest').doc().set(data).then(() => {
				let error = null
				res.redirect('Hospital_login' + error);
			})
				.catch(err => {
					let error = "Some error occured, Please try again later";
					res.render('register', {
						error: error,
						data: {
							name: req.body.name,
							mname: req.body.mname,
							beds: req.body.beds,
							area: req.body.area,
							marea: req.body.marea
						}
					});
				})

		})

})

hosp.get('/hosp_dashboard', (req, res) => {

	if (req.session.logid) {
		db.collection('hospitals').where('id', '==', req.session.logid).get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('Error getting documents', err);
					res.render('Hospital_login', {
						error: "Some error occured during logging in"
					});
				}
				else {
					snapshot.forEach(doc => {
						res.render('hosp_dashboard', {
							id: req.session.logid,
							data: doc.data(),

						})

					});

				}
			})
			.catch(err => {
				console.log('Error getting documents', err);
				res.render('Hospital_login', {
					error: "Some error occured during logging in"
				});
			});

		;

	} else {
		res.redirect('/');
	}
})

hosp.get('/add_patient', (req, res) => {

	if (req.session.logid) {
		res.render('add_patient', { id: req.session.logid })
	} else {
		res.redirect('/');
	}
})

hosp.post('/add_patient', urlencodedParser, (req, res) => {

	if (req.session.logid) {

		db.collection('hospitals').where("id", "==", req.session.logid).get().then((snapshot) => {
			snapshot.forEach(doc => {
				var patients = []
				if (doc.data().hasOwnProperty("patients"))
					patients = doc.data().patients;
				patients.push({
					age: req.body.age,
					name: req.body.name,
					gender: req.body.gender
				})

				db.collection('hospitals').doc(doc.id).update({ patients: patients }).then((msg) => {
					res.redirect("add_patient")
				}).catch((err) => {
					console.log(err, "error getting data")
				})


			})
		})
	} else {
		res.redirect('/');
	}
})

hosp.get('/update_patient', (req, res) => {

	if (req.session.logid) {


		db.collection('hospitals').where('id', '==', req.session.logid).get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					return;
				}
				var data = []
				snapshot.forEach(doc => {
					console.log(doc.data().patients)
					doc.data().patients.forEach((value, index) => {
						data.push({
							name: value.name,
							gender: value.gender,
							age: value.age,
						})
					})
				});

				res.render('update_patient', {
					id: req.session.logid,
					data: data
				});
			})
			.catch(err => {
				console.log('Error getting documents', err);
			});

	} else {
		res.redirect('/');
	}
})

hosp.get('/update_hosp', (req, res) => {

	if (req.session.logid) {

		db.collection('hospitals').where('id', '==', req.session.logid).get()
			.then((snapshot) => {
				snapshot.forEach(doc => {

					res.render('update_hosp', {
						id: req.session.logid,
						name: doc.data().name,
						type: doc.data().type,
						area: doc.data().address,
						beds: doc.data().beds,
						hospid: doc.id
					})
				})
			})

	} else {
		res.redirect('/');
	}
})


hosp.post('/update_patient', urlencodedParser, (req, res) => {

	if (req.session.logid) {
		db.collection('hospitals').where('id', '==', req.session.logid).get()
			.then(snapshot => {
				if (snapshot.empty) {
					console.log('No matching documents.');
					return;
				}
				var data = [];
				var id;
				snapshot.forEach(doc => {
					console.log(doc.data().patients)
					doc.data().patients.forEach((value, index) => {
						data.push({
							name: value.name,
							gender: value.gender,
							age: value.age,
						})
					})

					id = doc.id;
				});
				data[req.body.id] = {
					name: req.body.name,
					gender: req.body.gender,
					age: req.body.age,
				}


				db.collection('hospitals').doc(id).update({ patients: data }).then(() => {
					res.redirect('/update_patient/');
				})

			})
			.catch(err => {
				console.log('Error getting documents', err);
			});


	} else {
		res.redirect('/');
	}
})


hosp.post('/update_hosp', urlencodedParser, (req, res) => {

	if (req.session.logid) {

		var data = {
			name: req.body.name,
			beds: req.body.beds,
			type: req.body.type,
			address: req.body.area,
		}
		db.collection('hospitals').doc(req.body.hospid).update(data).then(() => {
			res.redirect('/hosp_dashboard/');
		})


	} else {
		res.redirect('/');
	}
})



// ===================================================end of hosp ================================================================================================

// =================================================== start of grievance ========================================================================



gre.get('/', (req, res) => {
	let msg2 = null
	res.render('grievance', { msg2: msg2 });
})

var transporter = nodemailer.createTransport({

	service: 'gmail',
	host: 'smtp.gmail.com',
	secure: true,
	port: 465,
	auth: {
		user: 'helixstacktechnologies@gmail.com',
		pass: 'HelixstackLLP@tech'
	}
});

gre.post('/', (req, res) => {

	let formdata = new Map();
	let base64string = [];
	var attachments = [];
	var busboy = new Busboy({
		headers: req.headers
	});

	busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {

		file.on('data', function (data) {
			let binarydata = data;
			let buff = new Buffer(binarydata).toString("base64");

			base64string.push(buff);
			console.log("adding file uploaded attachment")
			// console.log(buff);

			attachments.push({
				filename: filename,
				content: buff,
				encoding: 'base64'
			})
		});

		var saveTo = path.join(os.tmpDir(), path.basename(fieldname));
		file.pipe(fs.createWriteStream(saveTo));
	});

	busboy.on('field', function (fieldname, val) {
		// console.log(fieldname," ",val)
		formdata.set(fieldname, val);
	})

	busboy.on('finish', function () {
		var msg = "from : " + formdata.get('name') + '\n' + formdata.get('message')
		var type = formdata.get('type');
		if (formdata.get('type') == 'others') {
			type = formdata.get('color');
		}


		var mailOptions = {
			from: formdata.get('contact'),
			to: 'aniketgiram2404@gmail.com',
			subject: type,
			text: msg,
			// attachments: attachments,
		};

		transporter.sendMail(mailOptions, function (error, info) {
			if (error) {

				let msg2 = "Some error occured"
				res.render('grievance', { msg2: error });


			} else {

				// console.log('email sent: ' + info.response);
				// attachments.forEach((data)=>{fs.unlinkSync(data.path)})

				db.collection('grievance').doc().set({
					image: base64string,
					type: type,
					message: formdata.get('message'),
					mail: formdata.get('contact'),
					name: formdata.get('name'),
				})
					.then(() => {
						let msg2 = 'Your grievance has been sent'
						res.render('grievance', { msg2: msg2 });
					})


			}
		});




	});

	busboy.end(req.rawBody);
	return req.pipe(busboy);


})	
