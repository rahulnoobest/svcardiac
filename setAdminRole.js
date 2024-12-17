const admin = import('firebase-admin');
const serviceAccount = import('./svcardiac-f6e93-firebase-adminsdk-1wnip-693e0db66b.json');

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
