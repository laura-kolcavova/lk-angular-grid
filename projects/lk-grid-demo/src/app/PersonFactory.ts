import { Person } from "./Person";

export class PersonFactory
{
    private firstNames = [
        "Nancy",
        "Andrew",
        "Janet",
        "Margaret",
        "Steven",
        "Michael",
        "Robert",
        "Laura",
        "Anne",
        "Nige",
  ];
  
  private lastNames = [
      "Davolio",
      "Fuller",
      "Leverling",
      "Peacock",
      "Buchanan",
      "Suyama",
      "King",
      "Callahan",
      "Dodsworth",
      "White",
  ];
  
  private cities = [
      "London",
      "Washington",
      "Paris",
      "Berlin",
      "Prague",
      "Barcelona",
      "Tokyo",
      "Peking",
      "Rio de Janeiro",
      "Oslo",
  ];
  
  private jobs = [
      "Accountant",
      "Vice President, Sales",
      "Sales Representative",
      "Technical Support",
      "Sales Manager",
      "Web Designer",
      "Software Developer",
  ]

  private hobbies = [
    "Reading",
    "Crocheting",
    "Cooking",
    "Sport",
    "Video games",
    "Music",
    "Movies",
  ]

  private getRandomValue<T>(arr: T[]): T {
    let val: T = arr[Math.floor(Math.random() * arr.length)];
    return val;
  }

  private getRandomAge(): number
  {
    let min = 1;
    let max = 100;

    return Math.round(Math.random() * (max - min) + min)
  }

  public create(count: number): Person[]
  {
    let data: Person[] = [];

    for (let i = 0; i < count; i++)
    {
        let item: Person = {
            id: i + 1,
            firstName: this.getRandomValue(this.firstNames),
            lastName: this.getRandomValue(this.lastNames),
            city: this.getRandomValue(this.cities),
            job: this.getRandomValue(this.jobs),
            age: this.getRandomAge(),
            hobby: this.getRandomValue(this.hobbies)
        };

        data.push(item);
    }

    return data;
  }
}