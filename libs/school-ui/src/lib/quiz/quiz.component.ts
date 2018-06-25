import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit {
  @Input() name = 'Test 1';
  @Input()
  questions = [
    {
      name: 'Q1',
      q: 'What is your name',
      options: ['Victor', 'Jeff', 'Justin', 'Aysegul', 'Tor', 'Dan']
    }
  ];

  constructor() {}

  ngOnInit() {}
}
