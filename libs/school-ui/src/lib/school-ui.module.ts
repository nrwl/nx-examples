import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Route } from '@angular/router';
import { LessonsComponent } from './lessons/lessons.component';
import { QuizComponent } from './quiz/quiz.component';
import { ExamsComponent } from './exams/exams.component';
import { SchoolComponent } from './school/school.component';
import { StudentsComponent } from './students/students.component';

export const schoolUiRoutes: Route[] = [
  {
    path: '',
    component: SchoolComponent,
    children: [
      { path: 'lessons', component: LessonsComponent },
      { path: 'exams', component: ExamsComponent },
      { path: 'quiz', component: QuizComponent },
      { path: 'students', component: StudentsComponent }
    ]
  }
];

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [LessonsComponent, QuizComponent, ExamsComponent, SchoolComponent, StudentsComponent]
})
export class SchoolUiModule {}
