import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Route } from '@angular/router';
import { LessonsComponent } from './lessons/lessons.component';
import { QuizComponent } from './quiz/quiz.component';
import { ExamsComponent } from './exams/exams.component';

export const schoolUiRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'lessons' },
  { path: 'lessons', component: LessonsComponent },
  { path: 'exams', component: ExamsComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [LessonsComponent, QuizComponent, ExamsComponent]
})
export class SchoolUiModule {}
