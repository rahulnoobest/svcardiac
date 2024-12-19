const admin = import('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG.service_account);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Assign 'admin' role to a specific user
const setAdminRole = async (uid) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log(`Admin role assigned to user with UID: ${uid}`);
  } catch (err) {
    console.error('Error assigning admin role:', err);
  }
};

// Replace 'USER_UID' with the actual user UID
setAdminRole('itan5Re2xadP7LtKmhuZHty1Sm23');
