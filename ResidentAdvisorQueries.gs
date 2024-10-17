// Source: https://stackoverflow.com/questions/34182163/how-to-get-residentadvisor-api-work
// This is what led me to believe it would be possible to reach out to Resident Advisor's GraphQL API
//--data '{"query":"query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) { eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: { attending: { priority: 1, order: DESCENDING } }) {   data {     id     listingDate     event {       ...eventFields       __typename     }     __typename   }   __typename }\r\n}\r\n\r\nfragment eventFields on Event { id title attending date contentUrl flyerFront queueItEnabled newEventForm images {   id   filename   alt   type   crop   __typename } venue {   id   name   contentUrl   live   __typename } __typename\r\n}","variables":{"filters":{"areas":{"eq":229},"listingDate":{"gte":"2023-06-01","lte":"2023-08-04"},"listingPosition":{"eq":1}},"pageSize":10}}'



const RA_QUERY_EVENT_LISTINGS = `query GET_EVENT_LISTINGS($filters: FilterInputDtoInput, $filterOptions: FilterOptionsInputDtoInput, $page: Int, $pageSize: Int) {
  eventListings(filters: $filters, filterOptions: $filterOptions, pageSize: $pageSize, page: $page) {
    data {
      id 
      event {
        date 
        startTime 
        endTime 
        title
        contentUrl 
        attending
        images {
          id 
          filename 
        } 
        venue {
          id 
          name 
          address
          contentUrl 
        } 
      } 
    } 
    totalResults 
  }
}`;

const RA_QUERY_POPULAR_EVENTS = `query GET_POPULAR_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) { 
  eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: {   
    attending: { priority: 1, order: DESCENDING } }) {   
      data {     
        id     
        listingDate     
        event {
          id 
          title 
          date 
          contentUrl 
          flyerFront 
          images {   
            id   
            filename   
            alt   
            type   
          } 
          venue {  
            id   
            name  
            address 
            contentUrl  
          }       
        }     
      }
      totalResults    
    }
  }
}`;

const RA_QUERY_ENUMERATE = `query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          name
          description
          defaultValue
        }
        isDeprecated
        deprecationReason
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
    }
    directives {
      name
      description
      locations
    }
  }
}`;

const RA_QUERY_SCHEMA = `fragment FullType on __Type {
  kind
  name
  fields(includeDeprecated: true) {
    name
    args {
      name
      defaultValue
    }
    isDeprecated {
      deprecationReason
    }
  }
  inputFields {
    name
    defaultValue
  }
  enumValues(includeDeprecated: true) {
    name
    isDeprecated {
      deprecationReason
    }
  }
  query IntrospectionQuery {
    __schema {
      queryType {
        name
      }
      mutationType {
        name
      }
      directives {
        name
        locations
      }
    }
}`;

const RA_SEARCH = `query {
  search(type:EventListing, query:"areas:218") {
    pageInfo {
      startCursor
      hasNextPage
      endCursor
    }
    userCount
    nodes {
      ... on User {
        bio
        company
        email
        id
        isBountyHunter
        isCampusExpert
        isDeveloperProgramMember
        isEmployee
        isHireable
        isSiteAdmin
        isViewer
        location
        login
        name
        url
        websiteUrl
      }
    }
  }
}`;

const RA_QUERY_TEST = `query GET_EVENTS($filters: FilterInputDtoInput, $pageSize: Int) {
  eventListings(filters: $filters, pageSize: $pageSize, page: 1, sort: {   
    attending: { priority: 1, order: DESCENDING } }) { 
      data {
        id
        listingDate
        event {
          id 
          title 
          date 
          contentUrl 
          flyerFront 
          images {   
            id   
            filename   
            alt   
          } 
          venue {  
            id   
            name   
            address
            contentUrl  
          }
        }     
      }   
    }
  }
}`;
    


