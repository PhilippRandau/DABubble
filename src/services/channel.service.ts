import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, arrayUnion, updateDoc, collection, addDoc, query, where, getDocs } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  db = getFirestore();
  public authorizedChannelsSubject = new BehaviorSubject<any[]>([]);
  authorizedChannels = this.authorizedChannelsSubject.asObservable();

  constructor(
    public afAuth: AngularFireAuth,
    public afs: AngularFirestore,
  ) { }

  async createNewChannel(channel: string) {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user !== null) {
      try {
        const channelCollectionRef = collection(this.db, 'channels');
        const newChannel = {
          channelName: channel,
          createdBy: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          assignedUsers: [
            user.uid,
          ]
        };
        const docRef = await addDoc(channelCollectionRef, newChannel);
        this.getAuthorizedChannels(user.uid);
      } catch (error) {
        console.error("Error beim Erstellen eines neuen Channels: ", error);
      }
    } else {
      console.error("Kein Benutzer ist eingeloggt");
    }
  }

  async getAuthorizedChannels(uid: string) {
    const allDocuments = query(collection(this.db, 'channels'), where('assignedUsers', 'array-contains', uid));

    const querySnapshot = await getDocs(allDocuments);
    const channels: any[] = [];
    querySnapshot.forEach((doc) => {
      channels.push(doc.data().channelName);
    });
    this.authorizedChannelsSubject.next(channels);
  }

  async findUserByName(name: string): Promise<string | null> {
    const usersSnapshot = await getDocs(query(collection(this.db, 'users'), where('user_name', '==', name)));

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      console.log(userDoc);
      return userDoc.data().uid;
    }

    return null;
  }

  async addUserToChannel(channelName: string, uid: string) {
    const channelSnapshot = await getDocs(query(collection(this.db, 'channels'), where('channelName', '==', channelName)));

    if (!channelSnapshot.empty) {
      const channelDoc = channelSnapshot.docs[0];
      await updateDoc(channelDoc.ref, {
        assignedUsers: arrayUnion(uid)
      });
    } else {
      console.error(`Kein Channel gefunden mit dem Namen: ${channelName}`);
    }
  }
}