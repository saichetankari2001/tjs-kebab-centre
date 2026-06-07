# IMPORTANT - Update your Firebase Firestore Rules

Go to: console.firebase.google.com → Firestore → Rules

Replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click Publish. This fixes the "Error placing order" issue.
