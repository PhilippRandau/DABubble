import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { AddPplToChannelComponent } from '../dialog-add-ppl-to-channel/add-ppl-to-channel.component';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-add-channel',
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss']
})
export class AddChannelComponent {
  addPPlRef: MatDialogRef<AddPplToChannelComponent>;
  addPplOpen: boolean = false;



  form = new FormGroup({
    'channel-name': new FormControl(''),
    'description': new FormControl('')
  });

  constructor(public dialog: MatDialog) {
    
  }

  closeDialog() {
    this.dialog.closeAll();
  } 

  openAddPplToChannel() {
    const channelName = this.form.controls['channel-name'].value;
    const description = this.form.controls['description'].value;
  
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = 'add-channel-dialog';
    dialogConfig.data = { channelName: channelName, description: description };

    this.dialog.closeAll();
  
    this.addPPlRef = this.dialog.open(AddPplToChannelComponent, dialogConfig);
    this.addPplOpen = true;
  
    this.addPPlRef.afterClosed().subscribe(() => {
      this.addPplOpen = false;
    });
  }
  
  
}