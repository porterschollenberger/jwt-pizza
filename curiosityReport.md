# Curiosity Report

For my curiosity report, I wanted to look into no-code/low-code application deployment technologies. Particularly Mendix because I just took a new job that will be utilizing this software. This way I can learn something that will be very applicable and have a greater understanding of these concepts that have always seemed foreign to me.

## Difference between no-code and low-code

Both no and low code solutions provide accessible tools for those not familiar with traditional programing concepts to make application deployment easy for everyone.

These solution also remove the overhead of application deployment, abstracting away a lot of the complicated elements that would normally cause a lot of hiccups for new developers.

No code solutions are designed with data in mind. It provides a way for business minded individuals to create simple apps in a very time efficient way. The downside is, however, architecture constraints. Most do not have flexibility to customize things like user experience or deployment options, forcing a lot of restrictions on the overall app.

Low code solutions incorporate the high speed development process of no code, but provide the extra flexibility and functionality that is missing from no code solutions.

## Problems and Upsides

No code development platforms are seen as being too simple to support most modern complex applications.
Low code are considered too complex for non-professional developers to use.

Luckily, no code and low code solutions can instead help bridge the gap between business and IT to create the apps that work for the business.
It all comes down to understanding the needs of your business and picking and choosing the best options for such.

## Medix

I went ahead and built my own site to see how simple and easy it was. It was shocking how with the click of just a few buttons I could have a Hello World application built AND deployed just like that!

I found a video online that tells what happens under the hood when you publish your application. When you create an app and publish it, it creates a Git repository on your team's server, a project based manager requirement feedback, and a cloud deployment environment. 

The application is interpreted by the custom Mendix runtime created using Java, Scala, and Jetty.

The application is hosted automatically in AWS if using the Mendix cloud. The application information is stored in RDS and files for the app are stored in S3. You don't need to set any of these up yourself!

All user information comes into the application through a NGINX instance. It functions as a load balancer, authenticator, and SSL terminator. One or more application instances can run behind it.

The Mendix platform allows for you to customize how many runtime environments you want to have, and they automatically scale the application to meet the specified requirements.

Currently in beta, Mendix offers support for CI/CD pipelines to be embedded directly into the application, allowing for the seamless DevOps work ew all know and love.

It would seem that other sources say that Mendix applications can also be deployed on Azure and SAP, providing even more flexibility for your app.

Mendix has comprehensive test automation as well. Through their no code visual suite, you can create unit, component, process, and API testing. It is said this could reduce testing costs to less than 10% of the project budget.

Mendix will also automatically perform quality checks against your application according to the ISO 25010 industry standard for maintainability. 

## Conclusion

In all, Mendix is a leading low-code application development platform that enables rapid creation, deployment, and management of complex enterprise-grade applications, with its greatest uses being in modernizing legacy systems, optimizing internal operations, enhancing customer interactions, and driving innovation through AI-assisted development and robust DevOps integration