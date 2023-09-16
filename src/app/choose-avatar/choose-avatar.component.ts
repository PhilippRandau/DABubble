import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'services/authentication.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UploadService } from 'services/upload.service';
import { MessagesService } from 'services/messages.service';
import { ChannelService } from 'services/channel.service';

@Component({
  selector: 'app-choose-avatar',
  templateUrl: './choose-avatar.component.html',
  styleUrls: ['./choose-avatar.component.scss']
})
export class ChooseAvatarComponent implements OnInit {




  uploadProgress: number = 0;
  selectedFile: File = null;
  images = ['/assets/img/small_avatar/avatar (1).png', '/assets/img/small_avatar/avatar (2).png', '/assets/img/small_avatar/avatar (3).png', '/assets/img/small_avatar/avatar (4).png', '/assets/img/small_avatar/avatar (5).png', '/assets/img/small_avatar/avatar (6).png']
  imageUrl: string = '/assets/img/big_avatar/81. Profile.png'
  file_error: boolean;

  constructor(
    public authService: AuthenticationService,
    private storage: AngularFireStorage,
    private router: Router,
    public uploadService: UploadService,
    public messageService: MessagesService,
    public channelService: ChannelService,
  ) { }


  ngOnInit(): void {
    this.channelService.loadStandardChannel()

  }



  onFileSelected(event: any) {
    this.file_error = false
    this.selectedFile = event.target.files[0];
    if (this.selectedFile && this.selectedFile.type.startsWith('image/')) {
      this.uploadImage();
    } else {
      this.file_error = true
    }
  }


  setAvatar(image: string) {
    this.authService.setAvatarImage(image)
    this.imageUrl = image
  }


  uploadImage() {
    this.file_error = false
    const filePath = this.authService.userData.uid + '/' + 'avatar_' + this.selectedFile.name;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, this.selectedFile);
    uploadTask.percentageChanges().subscribe(progress => {
      this.uploadProgress = progress;
    });
    uploadTask.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe(downloadURL => {
          this.setAvatar(downloadURL)
        });
      })
    ).subscribe(
      error => {
        this.file_error = true
      }
    );
  }


  async goToMain() {
    let user = this.authService.userData.user_name
    await this.uploadService.checkForUpload()
    this.messageService.messageText = user + ' ist #allgemein beigetreten.'
    await this.messageService.newMessage()
    this.channelService.loadStandardChannel();
    await this.messageService.getMessages()
    this.router.navigateByUrl('/main');
  }
}
