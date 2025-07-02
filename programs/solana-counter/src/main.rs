// Writing a Function
// fn greet(name: &str) {
//     println!("Hello, {}!", name);
// }

// fn main() {
//     greet("Rohit");
// }


// Sum of Two Numbers
// fn sum(a: i32, b: i32) -> i32 {
//     a + b
// }

// fn main() {
//     let result = sum(5, 7);
//     println!("The sum is: {}", result);
// }


// Even or Odd
// fn is_even(n: i32) -> bool {
//     n % 2 == 0
// }

// fn main() {
//     let number = 11;
//     if is_even(number) {
//         println!("{} is even", number);
//     } else {
//         println!("{} is odd", number);
//     }
// }


//Reverse a String
// fn reverse(s: &str) -> String {
//     s.chars().rev().collect()
// }

// fn main() {
//     let word = "Rust";
//     let reversed = reverse(word);
//     println!("Reversed: {}", reversed);
// }


// Fibonacci Series (up to n terms)
// fn fibonacci(n: u32) {
//     let (mut a, mut b) = (0, 1);
//     for _ in 0..n {
//         print!("{} ", a);
//         let temp = a;
//         a = b;
//         b = temp + b;
//     }
//     println!();
// }

// fn main() {
//     fibonacci(10);
// }


// Factorial Using Recursion
// fn factorial(n: u64) -> u64 {
//     if n == 0 {
//         1
//     } else {
//         n * factorial(n - 1)
//     }
// }

// fn main() {
//     let num = 5;
//     println!("Factorial of {} is {}", num, factorial(num));
// }


// Find Maximum in Array
fn find_max(arr: &[i32]) -> i32 {
    let mut max = arr[0];
    for &num in arr.iter() {
        if num > max {
            max = num;
        }
    }
    max
}

fn main() {
    let numbers = [3, 9, 5, 6, 2];
    println!("Max number is: {}", find_max(&numbers));
}
