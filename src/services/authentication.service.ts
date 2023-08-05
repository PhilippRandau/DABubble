import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { doc, getDoc, getFirestore, updateDoc, collection, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ChannelService } from './channel.service';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  db = getFirestore();
  userData: any = [];
  signIn_successful: boolean
  signIn_error: boolean
  email_error: boolean
  signUp_successful: boolean
  userName: string
  searchControlValue = new BehaviorSubject<string>('');
  email_send: boolean = null;


  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
    private router: Router,
    public channelService: ChannelService
  ) {

    this.afAuth.authState.subscribe((user) => {
      if (user) {
        setTimeout(() => this.getUserData(user.uid), 500);
        this.channelService.getAuthorizedChannels(user.uid);
        localStorage.setItem('user', JSON.stringify(this.userData));
      } else {
        localStorage.setItem('user', 'null');
      }
    });
  }


  async getUserData(uid: string) {
    const userRef = doc(this.db, "users", uid);
    let docSnap = await getDoc(userRef);
    this.userData = docSnap.data()
    console.log(docSnap.data());

  }

  // Sign up with email/password
  async SignUp(email: string, password: string) {
    try {
      const result = await this.afAuth
        .createUserWithEmailAndPassword(email, password).then((result) => {
          this.SetUserData(result.user);
        })
      this.signUp_successful = true
      setTimeout(() => this.signUp_successful = false, 3000);
    } catch (error) {
      if (error.message == 'Firebase: Error (auth/email-already-in-use).') {
        this.email_error = true
        setTimeout(() => this.email_error = false, 3000);
      } else
        window.alert(error.message)
    }
  }

  // Sign in with email/password
  async SignIn(email: string, password: string) {
    try {
      const result = await this.afAuth
        .signInWithEmailAndPassword(email, password)
      this.signIn_successful = true
      setTimeout(() => this.signIn_successful = false, 3000);
    } catch (error) {
      this.signIn_error = true
      setTimeout(() => this.signIn_error = false, 3000);
    }
  }


  // Sign in with Google
  async GoogleAuth() {
    await this.AuthLogin(new GoogleAuthProvider());
  }


  async AuthLogin(provider: firebase.auth.AuthProvider | GoogleAuthProvider) {
    try {
      const result = await this.afAuth
        .signInWithPopup(provider).then((result) => {
          this.userName = result.user.displayName
          this.SetUserData(result.user);
        });
      this.signIn_successful = true
      setTimeout(() => this.signIn_successful = false, 3000);
    } catch (error) {
      window.alert(error.message);
    }
  }

  async ForgotPassword(passwordResetEmail: string) {
    await this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        this.email_send = true
        setTimeout(() => this.email_send = null, 3000);
      })
      .catch((error) => {
        this.email_send = false
        setTimeout(() => this.email_send = null, 3000);
      });
  }

  async SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userDataFirestore = {
      uid: user.uid,
      email: user.email,
      user_name: this.userName
    };
    await userRef.set(userDataFirestore, {
      merge: true,
    });
  }


  async signOut() {
    await this.afAuth.signOut();
    localStorage.removeItem('user');
    this.router.navigateByUrl('/sign-in');
    this.userData = []
  }



  async getAllUsers() {
    const usersSnapshot = await getDocs(collection(this.db, 'users'));
    let users = [];
    usersSnapshot.forEach((doc) => {
      users.push(doc.data());
    });
    return users;
  }

  async filterUsers(name: string): Promise<any[]> {
    const users = await this.getAllUsers();
    const filtered = users.filter(user => user.user_name?.toLowerCase().startsWith(name)
    );
    return filtered;
  }

  setSearchControlValue(value: string): void {
    this.searchControlValue.next(value);
  }

  async updateUserDetails(userName: string, email: string) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user !== null) {
      const userRef = doc(this.db, 'users', user.uid);

      await updateDoc(userRef, {
        user_name: userName,
        email: email
      });
      this.userData.user_name = userName;
      this.userData.email = email;
    } else {
      console.error("Kein Benutzer ist eingeloggt");
    }
  }

}